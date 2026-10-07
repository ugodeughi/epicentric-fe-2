import { z } from 'zod'

const optionalString = z.string().nullish()

/**
 * User as kept by the client. The backend returns the whole database record, including
 * the password hash and one-time codes: only the fields listed here are kept.
 * Field names follow the backend (PascalCase).
 */
export const UserSchema = z.object({
  Id: z.string(),
  Email: z.string(),
  FirstName: optionalString,
  LastName: optionalString,
  NickName: optionalString,
  AvatarImage: optionalString,
  LanguageId: optionalString,
  ActivePlanId: optionalString,
  State: z.number().nullish(),
  Settings: optionalString,
})

/** Response of POST users/login. */
export const LoginResponseSchema = z.object({
  Auth: z.string().min(1),
  User: UserSchema,
})

/** @typedef {z.infer<typeof UserSchema>} User */
