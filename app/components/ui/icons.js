// Stroke icons (24×24 viewBox). Inner SVG markup only; UiIcon sets stroke and size.
export const ICONS = {
  // Hugeicons (https://icones.js.org/collection/hugeicons), free set, MIT licence.
  view: '<g stroke-width="1.5"><path d="M21.544 11.045c.304.426.456.64.456.955c0 .316-.152.529-.456.955C20.178 14.871 16.689 19 12 19c-4.69 0-8.178-4.13-9.544-6.045C2.152 12.529 2 12.315 2 12c0-.316.152-.529.456-.955C3.822 9.129 7.311 5 12 5c4.69 0 8.178 4.13 9.544 6.045Z"/><path d="M15 12a3 3 0 1 0-6 0a3 3 0 0 0 6 0Z"/></g>',
  'view-off':
    '<g stroke-linecap="round" stroke-width="1.5"><path d="M22 8s-4 6-10 6S2 8 2 8"/><path stroke-linejoin="round" d="m15 13.5l1.5 2.5m3.5-5l2 2M2 13l2-2m5 2.5L7.5 16"/></g>',

  catalog:
    '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  epikey: '<path d="M12 2.5 20.5 7.3v9.4L12 21.5 3.5 16.7V7.3z" stroke-linejoin="round"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke-linecap="round"/>',
  minus: '<path d="M5 12h14" stroke-linecap="round"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5" stroke-linecap="round" stroke-linejoin="round"/>',
  fit: '<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" stroke-linecap="round" stroke-linejoin="round"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4" stroke-linecap="round"/>',
  logout:
    '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h9" stroke-linecap="round" stroke-linejoin="round"/>',
  close: '<path d="M6 6l12 12M18 6 6 18" stroke-linecap="round"/>',
  left: '<path d="M19 12H5M11 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/>',
  right: '<path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6" stroke-linecap="round" stroke-linejoin="round"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>',
  move: '<path d="M5 4v7a3 3 0 0 0 3 3h11M15 10l4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/>',
  trash:
    '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" stroke-linecap="round" stroke-linejoin="round"/>',
  template:
    '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><path d="M16.5 13.5v6M13.5 16.5h6" stroke-linecap="round"/>',
  music:
    '<path d="M9 18V6l10-2v12" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  image:
    '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5.5-5 4 3.5 3-2.5 4 3.5" stroke-linejoin="round"/>',
  video:
    '<rect x="3" y="5.5" width="13" height="13" rx="2.5"/><path d="m16 10.5 5-3v9l-5-3" stroke-linejoin="round"/>',
  file: '<path d="M6 3.5h8l4 4v13H6z" stroke-linejoin="round"/><path d="M14 3.5v4h4M9 13h6M9 16.5h6" stroke-linecap="round"/>',
  bookmark: '<path d="M7 3.5h10v17l-5-3.5-5 3.5z" stroke-linejoin="round"/>',
  freeze:
    '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 6l2.5-1.5M9.5 19.5 12 18l2.5 1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14" stroke-linecap="round" stroke-linejoin="round"/>',
  pause:
    '<rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/>',
  playSolid: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke-linejoin="round"/>',
  previous:
    '<path d="M7 5v14" stroke-linecap="round"/><path d="M18 5.5v13L9 12z" fill="currentColor" stroke-linejoin="round"/>',
  next: '<path d="M17 5v14" stroke-linecap="round"/><path d="M6 5.5v13L15 12z" fill="currentColor" stroke-linejoin="round"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/>',
}
