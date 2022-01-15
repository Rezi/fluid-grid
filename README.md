# Fluid Grid

CSS grid system we have been waiting for

Check examples and **documentation** at [fluid-grid.com](https://fluid-grid.com)

- Component ready

  - Same component in differently sized container behave similarly

- Container-query based

  - Component's grid depend on components size itself, not on window width

- Content driven

  - Just define optimal grid cell size. Then tell how many cells your content requires. Rest is done automatically.

- Declarative
  - Basic scenarios can be handled by minimal rules `.f-col`. No more `w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 mb-4`

## Install

Go to directory where you want to generate a fluid-grid.css

If you don't have npx installed, run:

```
$: npm i -g npx
```

Then run a fluid grid wizard with:

```
$: npx fluid-grid
```

Add following polyfill to enable @container queries in browsers which don't support it (There is zero zupport right now)
Beware that the polyfill has some limitations; you can only use px as units for cell definition. See more [here](https://github.com/GoogleChromeLabs/container-query-polyfill)

```
const supportsContainerQueries = 'container' in document.documentElement.style;

if (!supportsContainerQueries) {
	import('https://cdn.skypack.dev/container-query-polyfill');
}
```
