const sansCss = `
/* latin */
@font-face {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 400;
  src: url(https://mock.fonts.local/ibm-plex-sans-400.woff2) format('woff2');
}
/* latin */
@font-face {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  src: url(https://mock.fonts.local/ibm-plex-sans-500.woff2) format('woff2');
}
/* latin */
@font-face {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 600;
  src: url(https://mock.fonts.local/ibm-plex-sans-600.woff2) format('woff2');
}
`;

const sansCondensedCss = `
/* latin */
@font-face {
  font-family: 'IBM Plex Sans Condensed';
  font-style: normal;
  font-weight: 400;
  src: url(https://mock.fonts.local/ibm-plex-sans-condensed-400.woff2) format('woff2');
}
/* latin */
@font-face {
  font-family: 'IBM Plex Sans Condensed';
  font-style: normal;
  font-weight: 600;
  src: url(https://mock.fonts.local/ibm-plex-sans-condensed-600.woff2) format('woff2');
}
`;

const monoCss = `
/* latin */
@font-face {
  font-family: 'IBM Plex Mono';
  font-style: normal;
  font-weight: 400;
  src: url(https://mock.fonts.local/ibm-plex-mono-400.woff2) format('woff2');
}
/* latin */
@font-face {
  font-family: 'IBM Plex Mono';
  font-style: normal;
  font-weight: 500;
  src: url(https://mock.fonts.local/ibm-plex-mono-500.woff2) format('woff2');
}
`;

const serifCss = `
/* latin */
@font-face {
  font-family: 'IBM Plex Serif';
  font-style: normal;
  font-weight: 400;
  src: url(https://mock.fonts.local/ibm-plex-serif-400.woff2) format('woff2');
}
/* latin */
@font-face {
  font-family: 'IBM Plex Serif';
  font-style: normal;
  font-weight: 500;
  src: url(https://mock.fonts.local/ibm-plex-serif-500.woff2) format('woff2');
}
/* latin */
@font-face {
  font-family: 'IBM Plex Serif';
  font-style: normal;
  font-weight: 600;
  src: url(https://mock.fonts.local/ibm-plex-serif-600.woff2) format('woff2');
}
`;

module.exports = {
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap': sansCss,
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@400;600&display=swap': sansCondensedCss,
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap': monoCss,
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;500;600&display=swap': serifCss,
};
