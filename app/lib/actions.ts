'use server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Schema for form validation
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

// CreateInvoice schema without id and date fields
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// Function to create a new invoice
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100; // Convert amount to cents
  const date = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

  // Insert new invoice into the database
  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  // Revalidate and redirect to the invoice dashboard
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// Function to update an existing invoice
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100; // Convert amount to cents

  // Update existing invoice in the database
  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  // Revalidate and redirect to the invoice dashboard
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// Function to delete an existing invoice
export async function deleteInvoice(id: string) {
  await sql`
    DELETE FROM invoices
    WHERE id = ${id}
  `;

  // Revalidate and redirect to the invoice dashboard
  revalidatePath('/dashboard/invoices');
}
