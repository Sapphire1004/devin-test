import { SVGProps } from 'react';

const paths = {
  flag: <><path d="M6 21V3m0 1c5-4 7 4 13 0v10c-6 4-8-4-13 0" /><path d="M3 21h6" /></>,
  book: <><path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1v15" /><path d="M5 8h3m-3 4h3m8-4h3m-3 4h3" /></>,
  coffee: <><path d="M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zm13 1h2a3 3 0 0 1 0 6h-2M2 23h19M7 2v2m5-2v2" /></>,
  tree: <><path d="m12 2 7 9h-4l6 8H3l6-8H5zM12 19v4" /></>,
  mountain: <><path d="m2 20 8-15 6 10 2-4 5 9zm5-9 3 2 2-2M18 3v3m-2-1h4" /></>,
  arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
  scan: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 12h18M8 8h2m4 8h2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5" /></>,
  camera: <><path d="M8 5 9 3h6l1 2h5v15H3V5z" /><circle cx="12" cy="12" r="4" /></>,
  refresh: <><path d="M3 10a9 9 0 1 1 2 9M3 4v6h6" /></>,
  pin: <><path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Z" /><circle cx="12" cy="9" r="2" /></>,
  sparkle: <><path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" /></>,
  shield: <><path d="m12 2 8 3v6c0 5-8 11-8 11S4 16 4 11V5z" /><path d="m8 11 3 3 5-5" /></>,
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
