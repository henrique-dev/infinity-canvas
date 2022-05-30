(function($){
  $.fn.infinityCanvas = function(options) {

    let debug = true;

    let settings = {};

    let containerWidth = 0;
    let containerHeight = 0;

    let canvasWidth = 0;
    let canvasHeight = 0;

    let canvasDrawWidth = 0;
    let canvasDrawHeight = 0;

    let scrollElementWidth = 0;
    let scrollElementHeight = 0;

    let mainContainer = null;
    let canvas = null;

    let componentScrollV = null;
    let componentScrollH = null;
    let componentScrollS = null;

    let cameraArea = {x: 0, y: 0, width: 0, height: 0};
    let drawArea = {x: 0, y: 0, width: 0, height: 0};

    let intervalID = null;

    let onDraw = null;
    let onScroll = null;

    return this.each(function() {
      if (this.tagName == 'DIV') {

        settings = $.extend({
          drawWidth: 0,
          drawHeight: 0,
          refreshRate: 100,
          onDraw: function (canvas){},
          onScroll: function (x,y){}
        }, options);

        mainContainer = this;
        onDraw = settings.onDraw;
        onScroll = settings.onScroll;

        canvasDrawWidth = settings.drawWidth;
        canvasDrawHeight = settings.drawHeight;

        createElement();

        this.resizeElement = resizeElement;

        $(window).off('resize.infinity_scroll_resize').on('resize.infinity_scroll_resize', this.resizeElement);
      }
    });

    function resizeElement() {
      reCreateElement()
    }

    function reCreateElement() {
      createElement();
    };

    function createElement() {
      let scrollBarWidth = getScrollBarWidth();
      containerWidth = $(mainContainer).outerWidth();
      containerHeight = $(mainContainer).outerHeight();
      canvasWidth = containerWidth - scrollBarWidth;
      canvasHeight = containerHeight - scrollBarWidth;
      scrollElementWidth = containerWidth - scrollBarWidth;
      scrollElementHeight = containerHeight - scrollBarWidth;

      cameraArea = { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
      drawArea   = { x: 0, y: 0, width: canvasWidth, height: canvasHeight };

      $(mainContainer).empty();
      $(mainContainer).css('position', 'relative');
      $(mainContainer).append(`
        <canvas width='${canvasWidth}' height='${canvasHeight}' style='position: absolute; float: left; ${debug ? 'background: rosybrown; ' : ''}'></canvas>
        <div class='infinity-canvas-scroll-cmp-v' style='position: absolute; right: 0px; top: 0px; overflow-y: scroll; height: ${scrollElementHeight}px'>
          <div class='infinity-canvas-scroll-b' style='width: ${1}px; height: ${canvasDrawHeight}px;'></div>
        </div>
        <div class='infinity-canvas-scroll-cmp-h' style='position: absolute; left: 0px; bottom: 0px; overflow-x: scroll; width: ${scrollElementWidth}px'>
          <div class='infinity-canvas-scroll-b' style='width: ${canvasDrawWidth}px; height: ${1}px;'></div>
        </div>
        <div class='infinity-canvas-scroll-cmp-s' style='position: absolute; right: 0px; bottom: 0px; background: #dcdcdc; width: ${scrollBarWidth}px; height: ${scrollBarWidth}px'></div>
      `);

      componentScrollV = $(mainContainer).find('.infinity-canvas-scroll-cmp-v')[0];
      componentScrollH = $(mainContainer).find('.infinity-canvas-scroll-cmp-h')[0];
      componentScrollS = $(mainContainer).find('.infinity-canvas-scroll-cmp-s')[0];

      canvas = $(mainContainer).find('canvas')[0];
      mainContainer.canvas = $(mainContainer).find('canvas')[0];

      startCanvas();
    }

    function startCanvas() {
      canvas.context = canvas.getContext('2d');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvas.cameraArea = cameraArea;
      canvas.drawArea = drawArea;
      canvas.onDraw = settings.onDraw;
      canvas.onScroll = settings.onScroll;
      canvas.context.getCurrentOptionsOfCanvasContext = getCurrentOptionsOfCanvasContext;
      canvas.frameNo = 0;
      canvas.fatScrollY = canvasDrawHeight / canvasHeight;
      canvas.fatScrollX = canvasDrawWidth / canvasWidth;

      canvas.clear = function() {canvas.context.clearRect(0, 0, canvas.width, canvas.height);};

      canvas.context.ICdrawRect = ICdrawRect;
      canvas.context.ICfillRect = ICfillRect;

      if (intervalID != null) {
        clearInterval(intervalID);
      }

      intervalID = canvas.intervalID = setInterval(function() {
        if (canvas.cameraArea.x < 0) {
            canvas.cameraArea.x = 0;
        }
        if (canvas.cameraArea.y < 0) {
            canvas.cameraArea.y = 0;
        }
        canvas.context.strokeStyle = '#000';
        canvas.context.lineWidth = 1;

        canvas.context.fillStyle = '#FFF';
        canvas.context.fillRect(canvas.drawArea.x, canvas.drawArea.y, canvas.drawArea.width, canvas.drawArea.height);

        canvas.onDraw(canvas);

        canvas.context.fillStyle = '#F5F5F5';
        canvas.context.strokeStyle = '#fff';
      }, settings.refreshRate);

      $(componentScrollH).off().scroll(scrollHorizontal);
      $(componentScrollV).off().scroll(scrollVertical);
    }

    function scrollVertical(e, c) {
      canvas.cameraArea.y = jQuery(this).scrollTop();
      canvas.onScroll(jQuery(this).scrollLeft(), jQuery(this).scrollTop());
    }
    function scrollHorizontal(e) {
      canvas.cameraArea.x = (jQuery(this).scrollLeft() / canvas.fatScrollX);
      canvas.onScroll(jQuery(this).scrollLeft(), jQuery(this).scrollTop());
    }

    function getScrollBarWidth() {
      let containerToMeasureWidth = document.createElement('div');
      containerToMeasureWidth.style.visibility = 'hidden';
      containerToMeasureWidth.style.width = '100px';
      containerToMeasureWidth.style.msOverflowStyle = 'scrollbar';
      document.body.appendChild(containerToMeasureWidth);
      let widthNoScroll = containerToMeasureWidth.offsetWidth;
      containerToMeasureWidth.style.overflow = 'scroll';
      let inner = document.createElement('div');
      inner.style.width = '100%';
      containerToMeasureWidth.appendChild(inner);
      let widthWithScroll = inner.offsetWidth;
      containerToMeasureWidth.parentNode.removeChild(containerToMeasureWidth);
      return widthNoScroll - widthWithScroll;
    }

    // canvas functions
    function getCurrentOptionsOfCanvasContext() {
      return {
          globalAlpha: this.globalAlpha,
          lineWidth: this.lineWidth,
          lineCap: this.lineCap,
          strokeStyle: this.strokeStyle,
          fillStyle: this.fillStyle,
          font: this.font
      }
    }

    function ICdrawRect(area, optionsForContext = {}, optionsForComponent = {}) {

      let currentOptions = this.getCurrentOptionsOfCanvasContext();

      let settingsForApply = $.extend({
        translate: null,
        fixXY: null,
        drawAndFill: null,
        positionFixed: false
      }, optionsForComponent);

      let xToDraw = settingsForApply.positionFixed ? area.x : (area.x - cameraArea.x);
      let yToDraw = settingsForApply.positionFixed ? area.y : (area.y - cameraArea.y);

      for (key in optionsForContext) {
          if (optionsForContext.hasOwnProperty(key)) {
              this[key] = optionsForContext[key];
          }
      }
      if (settingsForApply.translate) {
          this.translate(settingsForApply.translate.x, settingsForApply.translate.y);
      }
      if (settingsForApply.fixXY) {
          if (settingsForApply.drawAndFill) {
              this.strokeRect(parseInt(xToDraw) + settingsForApply.fixXY, parseInt(yToDraw) + settingsForApply.fixXY, parseInt(area.w) + settingsForApply.fixXY, parseInt(area.h) + settingsForApply.fixXY);
              this.fillRect(parseInt(xToDraw) + settingsForApply.fixXY, parseInt(yToDraw) + settingsForApply.fixXY, parseInt(area.w) + settingsForApply.fixXY, parseInt(area.h) + settingsForApply.fixXY);
          } else {
              this.strokeRect(parseInt(xToDraw) + settingsForApply.fixXY, parseInt(yToDraw) + settingsForApply.fixXY, parseInt(area.w) + settingsForApply.fixXY, parseInt(area.h) + settingsForApply.fixXY);
          }
      } else {
          if (settingsForApply.drawAndFill) {
              this.strokeRect(xToDraw, yToDraw, area.w, area.h);
              this.fillRect(xToDraw, yToDraw, area.w, area.h);
          } else {
              this.strokeRect(xToDraw, yToDraw, area.w, area.h);
          }
      }
      for (key in currentOptions) {
          if (currentOptions.hasOwnProperty(key)) {
              this[key] = currentOptions[key];
          }
      }
      if (settingsForApply.translate) {
          this.setTransform(1, 0, 0, 1, 0, 0);
      }
    }

    function ICfillRect(area, optionsForContext = {}, optionsForComponent = {}) {

      let currentOptions = this.getCurrentOptionsOfCanvasContext();

      let settingsForApply = $.extend({
        translate: null,
        fixXY: null,
        drawAndFill: null,
        positionFixed: false
      }, optionsForComponent);

      let xToDraw = settingsForApply.positionFixed ? area.x : (area.x - cameraArea.x);
      let yToDraw = settingsForApply.positionFixed ? area.y : (area.y - cameraArea.y);

      for (key in optionsForContext) {
          if (optionsForContext.hasOwnProperty(key)) {
              this[key] = optionsForContext[key];
          }
      }
      if (settingsForApply.translate) {
          this.translate(settingsForApply.translate.x, settingsForApply.translate.y);
      }
      if (settingsForApply.fixXY) {
          if (settingsForApply.drawAndFill) {
              this.strokeRect(parseInt(xToDraw) + settingsForApply.fixXY, parseInt(yToDraw) + settingsForApply.fixXY, parseInt(area.w) + settingsForApply.fixXY, parseInt(area.h) + settingsForApply.fixXY);
              this.fillRect(parseInt(xToDraw) + settingsForApply.fixXY, parseInt(yToDraw) + settingsForApply.fixXY, parseInt(area.w) + settingsForApply.fixXY, parseInt(area.h) + settingsForApply.fixXY);
          } else {
              this.fillRect(parseInt(xToDraw) + settingsForApply.fixXY, parseInt(yToDraw) + settingsForApply.fixXY, parseInt(area.w) + settingsForApply.fixXY, parseInt(area.h) + settingsForApply.fixXY);
          }
      } else {
          if (settingsForApply.drawAndFill) {
              this.strokeRect(xToDraw, yToDraw, area.w, area.h);
              this.fillRect(xToDraw, yToDraw, area.w, area.h);
          } else {
              this.fillRect(xToDraw, yToDraw, area.w, area.h);
          }
      }
      for (key in currentOptions) {
          if (currentOptions.hasOwnProperty(key)) {
              this[key] = currentOptions[key];
          }
      }
      if (settingsForApply.translate) {
          this.setTransform(1, 0, 0, 1, 0, 0);
      }
  }
  }
})(jQuery);
