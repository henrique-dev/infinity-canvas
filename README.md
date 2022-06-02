# Infinity Canvas
## Description
This component has as objective the practicality and economy of resources when we use the canvas of the html, being able to overcome the limitation of the drawing area through methods of scroll.

## Install
`npm install infinity-canvas` and `import ICanvas from 'infinity-canvas';`

## Usage
First we must define a container for our component, with its respective size:
```html
<div id='canvas_container' style='width: 100%; height: 800px;'></div>
```

Then we take our container, and pass it to the component's constructor:
```javascript
const container = document.getElementById('canvas_container');
const elements = [
  {
    x: 10, y: 10, width: 100, height: 100, type: 'draw',
    contextOptions: {globalAlpha: 0.5, fillStyle: "#85C1E9"},
    elementOptions: {positionFixed: false}
  }
];

let infinityCanvas = new ICanvas(container, {
  elements: elements
});
```
With that we have our component created and with a rectangle drawn in the specified positions.

## Advanced Usage
### Options
The second parameter of the constructor is the options referring to its configurations and listening. We can pass the following values:
- `elements: Array` - Array of elements containing objects that will be drawn by the component itself.
- `drawWidth: Integer` - Width of the canvas.
- `drawHeight: Integer` - Height of the canvas.
- `refreshRate: Integer` - Drawing refresh rate.
- `onDraw: Function` - Function to be called when we want to take over the drawing manually.
- `onScroll: Function` - Function called when the canvas scroll event happens.
- `onResize: Function` - Function called when the canvas resize event happens.

### Element
We can create an element to pass in the Array of elements to the canvas with the following definitions:
- `x: Integer` - Position x on the canvas where the element will be drawn.
- `y: Integer` - Position y on the canvas where the element will be drawn.
- `width`: Integer - Width of the element.
- `height`: Integer - Element height.
- `type`: String - Element drawing type.
- `contextOptions`: Object - Settings to be applied to the canvas.
- `elementOptions`: Object - Settings to be applied to the element.
