export type StepFunErrorPayload = {
  code?: string
  message: string
}

export function extractStepFunError(errorText: string, fallbackMessage: string): StepFunErrorPayload {
  const trimmedText = errorText.trim()

  if (!trimmedText) {
    return { message: fallbackMessage }
  }

  try {
    const parsed = JSON.parse(trimmedText)
    const message = parsed?.error?.message || parsed?.message || parsed?.error_description || trimmedText
    const code = parsed?.error?.type || parsed?.type || parsed?.code

    return {
      code: typeof code === 'string' ? code : undefined,
      message: typeof message === 'string' ? message : fallbackMessage,
    }
  } catch {
    return { message: trimmedText }
  }
}
