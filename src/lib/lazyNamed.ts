import { lazy } from 'react';

export function lazyNamed<T extends Record<string, any>, K extends keyof T>(
	loader: () => Promise<T>,
	key: K
) {
	return lazy(async () => {
		try {
			const mod = await loader();
			const Comp = mod[key];
			if (!Comp) {
				const keyStr = typeof key === 'string' ? key : JSON.stringify(key);
				throw new Error(`lazyNamed: export "${keyStr}" not found in module`);
			}
			return { default: Comp as any };
		} catch (error) {
			// Re-throw with better error message
			const keyStr = typeof key === 'string' ? key : 'unknown';
			console.error(`Failed to load lazy component "${keyStr}":`, error);
			throw error;
		}
	});
}


