export const GOOGLE_CLIENT_ID =
  '648050403382-j2s8afklj1r9d43r2patev314dmoje73.apps.googleusercontent.com'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string
            callback: (res: { credential: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }): void
          renderButton(
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon'
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              width?: number
            }
          ): void
          prompt(): void
          cancel(): void
        }
      }
    }
  }
}
