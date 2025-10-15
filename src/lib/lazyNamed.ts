import { lazy } from 'react';

export function lazyNamed<T extends Record<string, any>, K extends keyof T>(
	loader: () => Promise<T>,
	key: K
) {
	return lazy(async () => {
		const mod = await loader();
		const Comp = mod[key];
		if (!Comp) {
			throw new Error(`lazyNamed: export "${String(key)}" not found in module`);
		}
		return { default: Comp as any };
	});
}


