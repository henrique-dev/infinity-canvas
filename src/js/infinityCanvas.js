/* eslint no-underscore-dangle: 0 */
/*global ICanvas */
/*eslint no-undef: "error"*/

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ICanvas = {}));
})(this, ((exports) => {
  /**
  * Applies canvas on element.
  * @constructor
  * @param {HTMLDivElement} element - Element to apply mask
  * @param {Object} options - Custom options
  * @return {InfinityCanvas}
  */
  const ICanvas = function T2(element, ...args) {
    const options = args.length > 0 && args[0] !== undefined ? args[0] : {};
    return new ICanvas.InfinityCanvas(element, options);
  };

  let debug = true;

  let containerWidth;
  let containerHeight;

  let canvasWidth;
  let canvasHeight;

  let canvasDrawWidth;
  let canvasDrawHeight;

  let scrollBarWidth;

  let scrollElementWidth;
  let scrollElementHeight;

  let mainContainer;

  let componentCanvas;
  let componentScrollV;
  let componentScrollH;
  let componentScrollS;

  let fatScrollY;
  let fatScrollX;

  let cameraArea;
  let drawArea;

  let intervalID;
  let refreshRate;

  let onDraw;
  let onScroll;
  let onResize;
  let onMouseMove;
  let onMouseEnter;
  let onMouseUp;
  let onMouseDown;
  let onClick;

  let elements;

  function _applyElement() {
    containerWidth = mainContainer.getBoundingClientRect().width;
    containerHeight = mainContainer.getBoundingClientRect().height;
  }

  function _getCurrentOptionsOfCanvasContext() {
    return {
      globalAlpha: this.globalAlpha,
      lineWidth: this.lineWidth,
      lineCap: this.lineCap,
      strokeStyle: this.strokeStyle,
      fillStyle: this.fillStyle,
      font: this.font,
    };
  }

  function _ICdrawRect(area, optionsForContext = {}, optionsForComponent = {}) {
    const currentOptions = this.getCurrentOptionsOfCanvasContext();

    const settingsForApply = ({
      translate: null,
      fixXY: null,
      drawAndFill: null,
      positionFixed: false,
      ...optionsForComponent,
    });

    const xToDraw = settingsForApply.positionFixed ? area.x : (area.x - cameraArea.x);
    const yToDraw = settingsForApply.positionFixed ? area.y : (area.y - cameraArea.y);

    Object.keys(optionsForContext).forEach((key) => {
      this[key] = optionsForContext[key];
    });
    if (settingsForApply.translate) {
      this.translate(settingsForApply.translate.x, settingsForApply.translate.y);
    }
    if (settingsForApply.fixXY) {
      const x = parseInt(xToDraw, 10) + settingsForApply.fixXY;
      const y = parseInt(yToDraw, 10) + settingsForApply.fixXY;
      const w = parseInt(area.w, 10) + settingsForApply.fixXY;
      const h = parseInt(area.h, 10) + settingsForApply.fixXY;
      if (settingsForApply.drawAndFill) {
        this.strokeRect(x, y, w, h);
        this.fillRect(x, y, w, h);
      } else {
        this.strokeRect(x, y, w, h);
      }
    } else if (settingsForApply.drawAndFill) {
      this.strokeRect(xToDraw, yToDraw, area.w, area.h);
      this.fillRect(xToDraw, yToDraw, area.w, area.h);
    } else {
      this.strokeRect(xToDraw, yToDraw, area.w, area.h);
    }
    Object.keys(currentOptions).forEach((key) => {
      this[key] = currentOptions[key];
    });
    if (settingsForApply.translate) {
      this.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  function _ICfillRect(area, optionsForContext = {}, optionsForComponent = {}) {
    const currentOptions = this.getCurrentOptionsOfCanvasContext();

    const settingsForApply = Object.apply({
      translate: null,
      fixXY: null,
      drawAndFill: null,
      positionFixed: false,
    }, optionsForComponent);

    const xToDraw = settingsForApply.positionFixed ? area.x : (area.x - cameraArea.x);
    const yToDraw = settingsForApply.positionFixed ? area.y : (area.y - cameraArea.y);

    Object.keys(optionsForContext).forEach((key) => {
      this[key] = optionsForContext[key];
    });
    if (settingsForApply.translate) {
      this.translate(settingsForApply.translate.x, settingsForApply.translate.y);
    }
    if (settingsForApply.fixXY) {
      const x = parseInt(xToDraw, 10) + settingsForApply.fixXY;
      const y = parseInt(yToDraw, 10) + settingsForApply.fixXY;
      const w = parseInt(area.w, 10) + settingsForApply.fixXY;
      const h = parseInt(area.h, 10) + settingsForApply.fixXY;
      if (settingsForApply.drawAndFill) {
        this.strokeRect(x, y, w, h);
        this.fillRect(x, y, w, h);
      } else {
        this.fillRect(x, y, w, h);
      }
    } else if (settingsForApply.drawAndFill) {
      this.strokeRect(xToDraw, yToDraw, area.w, area.h);
      this.fillRect(xToDraw, yToDraw, area.w, area.h);
    } else {
      this.fillRect(xToDraw, yToDraw, area.w, area.h);
    }
    Object.keys(currentOptions).forEach((key) => {
      this[key] = currentOptions[key];
    });
    if (settingsForApply.translate) {
      this.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  function _ICclearRect() {
    this.clearRect(0, 0, componentCanvas.width, componentCanvas.height);
  }

  function _isInCameraArea(element) {
    const xi = element.x; const xwi = element.x + element.width;
    const xf = cameraArea.x; const xwf = cameraArea.x + cameraArea.width;
    const yi = element.y; const yhi = element.y + element.height;
    const yf = cameraArea.y; const yhf = cameraArea.y + cameraArea.height;
    if ((((xi >= xf) && (xi <= xwf)) || ((xwi >= xf) && (xwi <= xwf)))
      && (((yi >= yf) && (yi <= yhf)) || ((yhi >= yf) && (yhi <= yhf)))) {
      return true;
    }
    return false;
  }

  function _draw() {
    if (componentCanvas.cameraArea.x < 0) {
      componentCanvas.cameraArea.x = 0;
    }
    if (componentCanvas.cameraArea.y < 0) {
      componentCanvas.cameraArea.y = 0;
    }
    componentCanvas.context.strokeStyle = '#000';
    componentCanvas.context.lineWidth = 1;

    componentCanvas.context.fillStyle = '#FFF';
    componentCanvas.context.fillRect(drawArea.x, drawArea.y, drawArea.width, drawArea.height);

    if (onDraw(componentCanvas)) {
      elements.forEach((element) => {
        const elementToDraw = ({
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          type: 'none',
          contextOptions: {},
          elementOptions: {},
          ...element,
        });

        if (_isInCameraArea(element)) {
          const contextOptions = ({
            globalAlpha: 0.0,
            fillStyle: '#FFFFFF',
            ...elementToDraw.contextOptions,
          });

          const elementOptions = ({
            translate: null,
            fixXY: null,
            drawAndFill: null,
            positionFixed: false,
            ...elementToDraw.elementOptions,
          });

          switch (elementToDraw.type) {
            case 'draw':
              componentCanvas.context.ICdrawRect({
                x: elementToDraw.x,
                y: elementToDraw.y,
                w: elementToDraw.width,
                h: elementToDraw.height,
              }, contextOptions, elementOptions);
              break;
            case 'draw_and_fill':
              componentCanvas.context.ICfillRect({
                x: elementToDraw.x,
                y: elementToDraw.y,
                w: elementToDraw.width,
                h: elementToDraw.height,
              }, contextOptions, elementOptions);
              break;
            default:
              break;
          }
        }
      });
    }

    componentCanvas.context.fillStyle = '#F5F5F5';
    componentCanvas.context.strokeStyle = '#fff';
  }

  function _wheel(e) {
    const scrollY = e.deltaY / 10;
    componentScrollV.scroll(0, componentScrollV.scrollTop + scrollY);
    componentCanvas.cameraArea.y = componentScrollV.scrollTop;
    return e;
  }

  function _scrollVertical(e) {
    componentCanvas.cameraArea.y = this.scrollTop;
    onScroll(this.scrollLeft, this.scrollTop);
    return e;
  }

  function _scrollHorizontal(e) {
    componentCanvas.cameraArea.x = this.scrollLeft;
    onScroll(this.scrollLeft, this.scrollTop);
    return e;
  }

  function _getScrollBarWidth() {
    const containerToMeasureWidth = document.createElement('div');
    containerToMeasureWidth.style.visibility = 'hidden';
    containerToMeasureWidth.style.width = '100px';
    containerToMeasureWidth.style.msOverflowStyle = 'scrollbar';
    document.body.appendChild(containerToMeasureWidth);
    const widthNoScroll = containerToMeasureWidth.offsetWidth;
    containerToMeasureWidth.style.overflow = 'scroll';
    const inner = document.createElement('div');
    inner.style.width = '100%';
    containerToMeasureWidth.appendChild(inner);
    const widthWithScroll = inner.offsetWidth;
    containerToMeasureWidth.parentNode.removeChild(containerToMeasureWidth);
    return widthNoScroll - widthWithScroll;
  }

  function _createElements() {
    scrollBarWidth = _getScrollBarWidth();
    canvasWidth = containerWidth - scrollBarWidth;
    canvasHeight = containerHeight - scrollBarWidth;
    scrollElementWidth = containerWidth - scrollBarWidth;
    scrollElementHeight = containerHeight - scrollBarWidth;
    cameraArea = {
      x: 0, y: 0, width: canvasWidth, height: canvasHeight,
    };
    drawArea = {
      x: 0, y: 0, width: canvasWidth, height: canvasHeight,
    };

    mainContainer.textContent = '';
    mainContainer.style.position = 'relative';
    mainContainer.style['padding'] = '0px';
    mainContainer.style['margin'] = '0px';

    componentCanvas = document.createElement('canvas');
    componentCanvas.width = canvasWidth;
    componentCanvas.height = canvasHeight;
    componentCanvas.style.position = 'absolute';
    componentCanvas.style.float = 'left';
    if (debug) componentCanvas.style.background = 'rosybrown';
    mainContainer.appendChild(componentCanvas);

    componentScrollV = document.createElement('div');
    componentScrollV.style.position = 'absolute';
    componentScrollV.style.right = '0px';
    componentScrollV.style.top = '0px';
    componentScrollV.style.height = `${scrollElementHeight}px`;
    componentScrollV.style['overflow-y'] = 'scroll';
    const componentScrollVSpacer = document.createElement('div');
    componentScrollVSpacer.style.width = '1px';
    componentScrollVSpacer.style.height = `${canvasDrawHeight}px`;
    componentScrollV.appendChild(componentScrollVSpacer);
    mainContainer.appendChild(componentScrollV);

    componentScrollH = document.createElement('div');
    componentScrollH.style.position = 'absolute';
    componentScrollH.style.left = '0px';
    componentScrollH.style.bottom = '0px';
    componentScrollH.style.width = `${scrollElementWidth}px`;
    componentScrollH.style['overflow-x'] = 'scroll';
    const componentScrollHSpacer = document.createElement('div');
    componentScrollHSpacer.style.height = '1px';
    componentScrollHSpacer.style.width = `${canvasDrawWidth}px`;
    componentScrollH.appendChild(componentScrollHSpacer);
    mainContainer.appendChild(componentScrollH);

    componentScrollS = document.createElement('div');
    componentScrollS.style.position = 'absolute';
    componentScrollS.style.right = '0px';
    componentScrollS.style.bottom = '0px';
    componentScrollS.style.background = '#dcdcdc';
    componentScrollS.style.width = `${scrollBarWidth}px`;
    componentScrollS.style.height = `${scrollBarWidth}px`;
    mainContainer.appendChild(componentScrollS);

    mainContainer.onResize = onResize;
    mainContainer.onMouseMove = onMouseMove;
    mainContainer.onMouseEnter = onMouseEnter;
    mainContainer.onMouseUp = onMouseUp;
    mainContainer.onMouseDown = onMouseDown;
    mainContainer.onClick = onClick;
  }

  function _mouseMove(e) {
    let cursorType = 'default';
    elements.forEach((element) => {
      if ((e.offsetX >= element.x - cameraArea.x)
           && (e.offsetX <= element.x + element.width - cameraArea.x)
           && (e.offsetY >= element.y - cameraArea.y)
           && (e.offsetY <= element.y + element.height - cameraArea.y)) {
        cursorType = 'pointer';
      }
    });
    componentCanvas.style.cursor = cursorType;
  }

  function _clearInterval() {
    if (intervalID != null) {
      clearInterval(intervalID);
    }
  }

  function _startCanvas() {
    componentCanvas.context = componentCanvas.getContext('2d');
    componentCanvas.cameraArea = cameraArea;
    componentCanvas.drawArea = drawArea;
    componentCanvas.context.getCurrentOptionsOfCanvasContext = _getCurrentOptionsOfCanvasContext;
    componentCanvas.frameNo = 0;
    fatScrollY = canvasDrawHeight / canvasHeight;
    componentCanvas.fatScrollY = fatScrollY;
    fatScrollX = canvasDrawWidth / canvasWidth;
    componentCanvas.fatScrollX = fatScrollX;
    componentCanvas.clear = _ICclearRect;
    componentCanvas.context.ICdrawRect = _ICdrawRect;
    componentCanvas.context.ICfillRect = _ICfillRect;
    _clearInterval();

    intervalID = setInterval(_draw, refreshRate);
    componentCanvas.intervalID = intervalID;

    componentScrollH.addEventListener('scroll', _scrollHorizontal, false);
    componentScrollV.addEventListener('scroll', _scrollVertical, false);
    componentCanvas.addEventListener('wheel', _wheel, false);
    componentCanvas.addEventListener('mousemove', _mouseMove, false);
  }

  function _applyOptions(options) {
    const newOptions = ({
      debug: false,
      drawWidth: 0,
      drawHeight: 0,
      refreshRate: 100,
      onDraw: () => true,
      onScroll: () => true,
      onResize: () => true,
      onMouseMove: () => true,
      onMouseEnter: () => true,
      onMouseUp: () => true,
      onMouseDown: () => true,
      onClick: () => true,
      elements: [],
      ...options,
    });

    debug = newOptions.debug;
    canvasDrawWidth = newOptions.drawWidth;
    canvasDrawHeight = newOptions.drawHeight;
    refreshRate = newOptions.refreshRate;
    onDraw = newOptions.onDraw;
    onScroll = newOptions.onScroll;

    onResize = newOptions.onResize;
    onMouseMove = newOptions.onMouseMove;
    onMouseEnter = newOptions.onMouseEnter;
    onMouseUp = newOptions.onMouseUp;
    onMouseDown = newOptions.onMouseDown;
    onClick = newOptions.onClick;

    elements = newOptions.elements;
  }

  function _elementIsDiv(element) {
    return element.tagName === 'DIV';
  }

  function _init() {
    _applyElement();
    _createElements();
    _startCanvas();
  }

  function _resizeElements() {
    _init();
  }

  const IC = (function T3() {
    function InfinityCanvas(element, options) {
      if (_elementIsDiv(element)) {
        mainContainer = element;
        _applyOptions(options);
        _init();
        this.resizeElement = _resizeElements;
        window.addEventListener('resize', _resizeElements, false);
      }
    }
    return InfinityCanvas;
  }());

  ICanvas.InfinityCanvas = IC;

  try {
    globalThis.ICanvas = ICanvas;
  } catch (e) {
    // continue regardless of error
  }

  exports.InfinityCanvas = IC;
  exports.default = ICanvas;

  Object.defineProperty(exports, '__esModule', { value: true });
}));
