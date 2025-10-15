export function prefetchRoute(importer: () => Promise<any>) {
	try { importer().catch(() => {}); } catch {}
}


