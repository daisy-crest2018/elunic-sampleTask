export interface RegistrationOutcome {
    success: boolean;
    username?: string;
    errorMessage?: string;
  }

  // Default outcome value
export const defaultOutcome: RegistrationOutcome = {
    success: false,
    errorMessage: 'No registration attempt made yet.'
};