'use server'

import { revalidatePath } from 'next/cache'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { redirect } from 'next/navigation'

import { createCategory } from '@/server/categories/create-category'
import { createKeywordRule } from '@/server/categories/create-keyword-rule'
import { deleteCategory } from '@/server/categories/delete-category'
import { deleteKeywordRule } from '@/server/categories/delete-keyword-rule'
import { CategoryError } from '@/server/categories/errors'
import {
  createCategoryBodySchema,
  createKeywordRuleBodySchema,
  updateCategoryBodySchema,
  updateContractorDefaultCategoryBodySchema,
  updateKeywordRuleBodySchema,
} from '@/server/categories/schemas'
import { updateCategory } from '@/server/categories/update-category'
import { updateKeywordRule } from '@/server/categories/update-keyword-rule'
import { updateContractorDefaultCategory } from '@/server/contractors/update-default-category'

function formString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function optionalFormString(formData: FormData, key: string) {
  const value = formString(formData, key).trim()
  return value === '' ? undefined : value
}

function redirectWithError(path: string, error: unknown): never {
  if (isRedirectError(error)) throw error

  const message =
    error instanceof CategoryError
      ? error.message
      : typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : 'Nieoczekiwany błąd'
  redirect(`${path}?error=${encodeURIComponent(message)}`)
}

export async function createCategoryAction(formData: FormData) {
  const raw = {
    name: formString(formData, 'name'),
    parentId: optionalFormString(formData, 'parentId') ?? null,
  }

  const parsed = createCategoryBodySchema.safeParse(raw)
  if (!parsed.success) {
    redirectWithError('/categories', parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane')
  }

  try {
    await createCategory(parsed.data)
    revalidatePath('/categories')
    revalidatePath('/contractors')
    revalidatePath('/documents')
    redirect('/categories?created=1')
  } catch (error) {
    redirectWithError('/categories', error)
  }
}

export async function updateCategoryAction(formData: FormData) {
  const id = formString(formData, 'id')
  const raw = {
    name: optionalFormString(formData, 'name'),
    parentId:
      formData.get('parentId') === ''
        ? null
        : optionalFormString(formData, 'parentId'),
  }

  const parsed = updateCategoryBodySchema.safeParse(raw)
  if (!parsed.success) {
    redirectWithError('/categories', parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane')
  }

  try {
    await updateCategory(id, parsed.data)
    revalidatePath('/categories')
    revalidatePath('/contractors')
    revalidatePath('/documents')
    redirect('/categories?saved=1')
  } catch (error) {
    redirectWithError('/categories', error)
  }
}

export async function deleteCategoryAction(formData: FormData) {
  const id = formString(formData, 'id')

  try {
    await deleteCategory(id)
    revalidatePath('/categories')
    revalidatePath('/contractors')
    revalidatePath('/documents')
    redirect('/categories?deleted=1')
  } catch (error) {
    redirectWithError('/categories', error)
  }
}

export async function createKeywordRuleAction(formData: FormData) {
  const parsed = createKeywordRuleBodySchema.safeParse({
    keyword: formString(formData, 'keyword'),
    categoryId: formString(formData, 'categoryId'),
    priority: optionalFormString(formData, 'priority') ?? 100,
  })
  if (!parsed.success) {
    redirectWithError('/categories', parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane')
  }

  try {
    await createKeywordRule(parsed.data)
    revalidatePath('/categories')
    revalidatePath('/documents')
    revalidatePath('/buffer')
    redirect('/categories?ruleCreated=1')
  } catch (error) {
    redirectWithError('/categories', error)
  }
}

export async function updateKeywordRuleAction(formData: FormData) {
  const id = formString(formData, 'id')
  const parsed = updateKeywordRuleBodySchema.safeParse({
    keyword: optionalFormString(formData, 'keyword'),
    categoryId: optionalFormString(formData, 'categoryId'),
    priority: optionalFormString(formData, 'priority'),
  })
  if (!parsed.success) {
    redirectWithError('/categories', parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane')
  }

  try {
    await updateKeywordRule(id, parsed.data)
    revalidatePath('/categories')
    revalidatePath('/documents')
    revalidatePath('/buffer')
    redirect('/categories?ruleSaved=1')
  } catch (error) {
    redirectWithError('/categories', error)
  }
}

export async function deleteKeywordRuleAction(formData: FormData) {
  const id = formString(formData, 'id')

  try {
    await deleteKeywordRule(id)
    revalidatePath('/categories')
    revalidatePath('/documents')
    revalidatePath('/buffer')
    redirect('/categories?ruleDeleted=1')
  } catch (error) {
    redirectWithError('/categories', error)
  }
}

export async function updateContractorDefaultCategoryAction(formData: FormData) {
  const contractorId = formString(formData, 'contractorId')
  const raw = {
    defaultCategoryId:
      formData.get('defaultCategoryId') === '' || formData.get('defaultCategoryId') === null
        ? null
        : formString(formData, 'defaultCategoryId'),
  }

  const parsed = updateContractorDefaultCategoryBodySchema.safeParse(raw)
  if (!parsed.success) {
    redirectWithError('/contractors', parsed.error.issues[0]?.message ?? 'Nieprawidłowe dane')
  }

  try {
    await updateContractorDefaultCategory(contractorId, parsed.data)
    revalidatePath('/contractors')
    revalidatePath('/documents')
    revalidatePath('/buffer')
    redirect('/contractors?saved=1')
  } catch (error) {
    redirectWithError('/contractors', error)
  }
}
