import { z } from 'zod'

const isoDate = z.string().transform((value, ctx) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    ctx.addIssue({ code: 'custom', message: `"${value}" nie jest poprawną datą ISO 8601` })
    return z.NEVER
  }
  return date
})

export const challengeSchema = z.object({
  challenge: z.string().min(1),
  timestampMs: z.number().int().positive(),
})

export const publicKeyCertificateSchema = z.object({
  certificate: z.string().min(1),
  publicKeyId: z.string().min(1),
  validFrom: isoDate,
  validTo: isoDate,
  usage: z.array(z.string()),
})

export const publicKeyCertificatesSchema = z.array(publicKeyCertificateSchema)

export const tokenSchema = z.object({
  token: z.string().min(1),
  validUntil: isoDate,
})

export const authInitiatedSchema = z.object({
  referenceNumber: z.string().min(1),
  authenticationToken: tokenSchema,
})

export const authStatusSchema = z.object({
  status: z.object({
    code: z.number().int(),
    description: z.string(),
    details: z.array(z.string()).nullish(),
  }),
})

export const authTokensSchema = z.object({
  accessToken: tokenSchema,
  refreshToken: tokenSchema,
})

export type PublicKeyCertificate = z.infer<typeof publicKeyCertificateSchema>
export type KsefToken = z.infer<typeof tokenSchema>
export type AuthStatus = z.infer<typeof authStatusSchema>
