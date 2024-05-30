import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import * as schema from "./schema";
import { zValidator } from "@hono/zod-validator";
import { object, string } from "zod";
import { asc, eq, or } from "drizzle-orm";

type Bindings = {
	DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.post(
	"/identify",
	// validator to ensure middleware is parsing the correct key and value
	zValidator(
		"json",
		object({
			phoneNumber: string(),
			email: string().email(),
		}),
	),
	async ({ env, req, json }) => {
		// db init (cloudflare D1 uses http based, needs to be initiated on every request)
		const db = drizzle(env.DB, { schema });
		const body = req.valid("json");

		// gettings contacts where email or phone number matches
		let contacts = await db
			.select()
			.from(schema.contactTable)
			.where(
				or(
					eq(schema.contactTable.email, body.email),
					eq(schema.contactTable.phone_number, body.phoneNumber),
				),
			)
			.orderBy(asc(schema.contactTable.created_at));

		if (!contacts.length) {
			// if no contacts, create one

			const primary = await db
				.insert(schema.contactTable)
				.values({
					email: body.email,
					phone_number: body.phoneNumber,
				})
				.returning()
				.get();

			return json({
				primaryContactId: primary.id,
				emails: [body.email],
				phoneNumbers: [body.phoneNumber],
				secondaryContactIds: [],
			});
		}

		let primary = contacts[0];
		// first row of matching result should be primary, if it isn't make it primary
		if (primary.link_precedence !== "primary") {
			primary = await db
				.update(schema.contactTable)
				.set({ link_precedence: "primary" })
				.returning()
				.where(eq(schema.contactTable.id, primary.id))
				.get();
		}

		const emailExists = contacts.find(
			(contact) => contact.email === body.email,
		);
		const phoneExists = contacts.find(
			(contact) => contact.phone_number === body.phoneNumber,
		);

		if (!phoneExists || !emailExists) {
			/* 
        if in the contact list, there is no contact with email or phone number
        create a new contact with email & phone
        and link it to the primary contact
      */

			const newContact = await db
				.insert(schema.contactTable)
				.values({
					email: body.email,
					phone_number: body.phoneNumber,
					link_precedence: "secondary",
					linked_id: primary.id,
				})
				.returning()
				.get();

			contacts = [...contacts, newContact];
		}

		/*
      only the first row of list should be primary,
      if there is other primary contact in the list
      make it secondary and link it to the primary contact
    */
		contacts = await Promise.all(
			contacts.map(async (contact, index) => {
				if (index === 0) {
					return contact;
				}

				if (contact.link_precedence === "primary") {
					const temp = await db
						.update(schema.contactTable)
						.set({
							link_precedence: "secondary",
							linked_id: primary.id,
						})
						.returning()
						.where(eq(schema.contactTable.id, contact.id))
						.get();
					return temp;
				}

				return contact;
			}),
		);

		const secondary = [
			...contacts.filter(
				(contact) => contact.link_precedence === "secondary",
			),
		];

		return json({
			contact: {
				primaryContactId: primary.id,
				emails: [primary.email, ...secondary.map((c) => c.email)],
				phoneNumbers: [
					primary.phone_number,
					...secondary.map((c) => c.phone_number),
				],
			},
			secondaryContactIds: secondary.map((c) => c.id),
		});
	},
);

export default app;
