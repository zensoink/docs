/// <reference types="astro/client" />

declare module 'virtual:starlight/user-config' {
	const config: any;
	export default config;
}

declare module 'virtual:starlight/user-images' {
	export const logos: {
		dark?: { src: string; width: number; height: number };
		light?: { src: string; width: number; height: number };
	};
}

declare module 'virtual:starlight/components/*' {
	const Component: (props: any) => any;
	export default Component;
}
