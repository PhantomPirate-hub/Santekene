/**
 * Service de retry pour les transactions Hedera
 * Implémente un backoff exponentiel pour réessayer les transactions échouées
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
}

class HederaRetryService {
  private readonly defaultOptions: Required<RetryOptions> = {
    maxRetries: 5,
    initialDelayMs: 1000, // 1 seconde
    maxDelayMs: 60000, // 60 secondes
    backoffMultiplier: 2,
    retryableErrors: [
      'BUSY',
      'PLATFORM_TRANSACTION_NOT_CREATED',
      'TIMEOUT',
      'UNAVAILABLE',
      'NETWORK_ERROR',
      'CONNECTION_ERROR',
    ],
  };

  /**
   * Calcule le délai de retry avec backoff exponentiel
   */
  private calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
    // Ajouter un jitter aléatoire pour éviter les "thundering herd"
    const jitter = Math.random() * 0.3 * delay;
    const finalDelay = Math.min(delay + jitter, options.maxDelayMs);
    return Math.floor(finalDelay);
  }

  /**
   * Vérifie si l'erreur est retryable
   */
  private isRetryableError(error: Error, retryableErrors: string[]): boolean {
    const errorMessage = error.message.toUpperCase();
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toUpperCase())
    );
  }

  /**
   * Attend pendant un délai donné
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Exécute une fonction avec retry automatique
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options?: RetryOptions,
    context?: string
  ): Promise<RetryResult<T>> {
    const opts: Required<RetryOptions> = {
      ...this.defaultOptions,
      ...options,
    };

    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempt = 0;

    const contextLog = context ? `[${context}] ` : '';

    while (attempt <= opts.maxRetries) {
      attempt++;

      try {
        console.log(`${contextLog}🔄 Tentative ${attempt}/${opts.maxRetries + 1}`);
        
        const result = await fn();
        const duration = Date.now() - startTime;

        if (attempt > 1) {
          console.log(`${contextLog}✅ Succès après ${attempt} tentatives (${duration}ms)`);
        }

        return {
          success: true,
          data: result,
          attempts: attempt,
          totalDuration: duration,
        };

      } catch (error) {
        lastError = error as Error;
        const duration = Date.now() - startTime;

        console.warn(
          `${contextLog}❌ Tentative ${attempt} échouée: ${lastError.message}`
        );

        // Si c'est la dernière tentative ou l'erreur n'est pas retryable
        if (attempt > opts.maxRetries || !this.isRetryableError(lastError, opts.retryableErrors)) {
          if (!this.isRetryableError(lastError, opts.retryableErrors)) {
            console.error(`${contextLog}🚫 Erreur non-retryable: ${lastError.message}`);
          } else {
            console.error(`${contextLog}🚫 Nombre maximal de tentatives atteint`);
          }

          return {
            success: false,
            error: lastError,
            attempts: attempt,
            totalDuration: duration,
          };
        }

        // Calculer le délai avant la prochaine tentative
        const delay = this.calculateDelay(attempt, opts);
        console.log(`${contextLog}⏳ Retry dans ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // Ne devrait jamais arriver ici, mais pour TypeScript
    const duration = Date.now() - startTime;
    return {
      success: false,
      error: lastError,
      attempts: attempt,
      totalDuration: duration,
    };
  }

  /**
   * Exécute plusieurs fonctions en parallèle avec retry
   */
  async executeMultipleWithRetry<T>(
    fns: Array<() => Promise<T>>,
    options?: RetryOptions,
    context?: string
  ): Promise<RetryResult<T>[]> {
    const promises = fns.map((fn, index) => 
      this.executeWithRetry(fn, options, `${context || 'Task'} ${index + 1}`)
    );

    return Promise.all(promises);
  }

  /**
   * Exécute une fonction avec retry et circuit breaker
   * (arrête les tentatives si trop d'échecs consécutifs)
   */
  async executeWithCircuitBreaker<T>(
    fn: () => Promise<T>,
    options?: RetryOptions & {
      failureThreshold?: number;
      resetTimeoutMs?: number;
    },
    context?: string
  ): Promise<RetryResult<T>> {
    const failureThreshold = options?.failureThreshold || 10;
    const resetTimeoutMs = options?.resetTimeoutMs || 60000;

    // Vérifier l'état du circuit breaker
    const circuitKey = `circuit:${context || 'default'}`;
    const circuitState = await this.getCircuitState(circuitKey);

    if (circuitState.isOpen && Date.now() - circuitState.lastFailureTime < resetTimeoutMs) {
      console.error(`🔴 Circuit breaker OPEN pour ${context}. Retry désactivé temporairement.`);
      return {
        success: false,
        error: new Error('Circuit breaker is OPEN'),
        attempts: 0,
        totalDuration: 0,
      };
    }

    // Exécuter avec retry
    const result = await this.executeWithRetry(fn, options, context);

    // Mettre à jour le circuit breaker
    if (!result.success) {
      await this.incrementCircuitFailures(circuitKey);
      const newState = await this.getCircuitState(circuitKey);
      
      if (newState.consecutiveFailures >= failureThreshold) {
        console.error(
          `🔴 Circuit breaker OUVERT pour ${context} après ${newState.consecutiveFailures} échecs`
        );
      }
    } else {
      // Réinitialiser le compteur en cas de succès
      await this.resetCircuitFailures(circuitKey);
    }

    return result;
  }

  // --- Méthodes privées pour le circuit breaker ---
  
  private circuitState: Map<string, { consecutiveFailures: number; lastFailureTime: number }> = new Map();

  private async getCircuitState(key: string): Promise<{ consecutiveFailures: number; lastFailureTime: number; isOpen: boolean }> {
    const state = this.circuitState.get(key) || { consecutiveFailures: 0, lastFailureTime: 0 };
    return {
      ...state,
      isOpen: state.consecutiveFailures >= 10,
    };
  }

  private async incrementCircuitFailures(key: string): Promise<void> {
    const state = this.circuitState.get(key) || { consecutiveFailures: 0, lastFailureTime: 0 };
    this.circuitState.set(key, {
      consecutiveFailures: state.consecutiveFailures + 1,
      lastFailureTime: Date.now(),
    });
  }

  private async resetCircuitFailures(key: string): Promise<void> {
    this.circuitState.delete(key);
  }

  /**
   * Obtient des statistiques sur les retry
   */
  getCircuitBreakerStats(): Array<{
    key: string;
    consecutiveFailures: number;
    lastFailureTime: number;
    isOpen: boolean;
  }> {
    const stats: Array<{
      key: string;
      consecutiveFailures: number;
      lastFailureTime: number;
      isOpen: boolean;
    }> = [];

    this.circuitState.forEach((state, key) => {
      stats.push({
        key,
        consecutiveFailures: state.consecutiveFailures,
        lastFailureTime: state.lastFailureTime,
        isOpen: state.consecutiveFailures >= 10,
      });
    });

    return stats;
  }

  /**
   * Réinitialise tous les circuit breakers (admin)
   */
  resetAllCircuitBreakers(): void {
    this.circuitState.clear();
    console.log('🔄 Tous les circuit breakers ont été réinitialisés');
  }
}

// Export singleton
export const hederaRetryService = new HederaRetryService();

