"use server";

import {
  deleteProjectById,
  editProjectById,
  duplicateProjectById,
} from "@/features/playground/actions";

export async function deleteProjectAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await deleteProjectById(id);
}

export async function updateProjectAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "");
  const description = String(formData.get("description") || "");
  if (!id || !title) return;
  await editProjectById(id, { title, description });
}

export async function duplicateProjectAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await duplicateProjectById(id);
}
