import { toast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

const notify = (message: string, type: ToastType): void => {
  switch (type) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    case 'info':
      toast.info(message);
      break;
    case 'warning':
      toast.warning(message);
      break;
    default:
      toast(message);
  }
};

export default class Notifier {
  static success(message: string): void {
    notify(message, 'success');
  }

  static info(message: string): void {
    notify(message, 'info');
  }

  static warn(message: string): void {
    notify(message, 'warning');
  }

  // static error(message: string | Error): void {
  //   const errorMessage =
  //     message instanceof Error ? message.message : message;
  //   notify(errorMessage, 'error');
  // }

  static error(error: unknown): void {
  let message = "Something went wrong";

  if (typeof error === "string") {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "details" in error
  ) {
    message = String((error as any).details);
  }

  notify(message, 'error');
}

}
