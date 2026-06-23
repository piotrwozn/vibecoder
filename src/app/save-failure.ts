export interface SaveFailureNotifier {
  report(ok: boolean): boolean;
}

export function createSaveFailureNotifier(showWarning: () => void): SaveFailureNotifier {
  let warningShown = false;

  return {
    report(ok: boolean): boolean {
      if (ok) {
        warningShown = false;
        return true;
      }

      if (!warningShown) {
        warningShown = true;
        showWarning();
      }

      return false;
    }
  };
}
