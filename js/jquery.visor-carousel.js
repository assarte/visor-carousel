/**
 * Created by assarte on 2015.10.22.
 */
+function ($) {
	'use strict';

	// VISOR CAROUSEL CLASS DEFINITION
	// ===============================

	var VisorCarousel = function (element, options) {
		this.$element		= $(element);
		this.$indicators	= this.$element.find('.carousel-indicators');
		this.$itemsParent	= this.$element.find('.carousel-inner').first();
		this.$wrapper		= null;
		this.options		= options;
		this.interval		= null;
		this.$active		= null;
		this.$items			= null;
		this.layout			= null; // 'landscape', 'portrait'
		this.lastItemIid	= 0;
		this.slidingTimer	= null;
		this.disabledControls	= true;
		this.disabledSliding	= true;

		if (this.$itemsParent.children('.item.active').length > 0) {
			this.$active = this.$itemsParent.children('.item.active').first();
		} else {
			this.$active = this.$itemsParent.children('.item').first();
			this.$active.addClass('active');
		}

		// clean-up mess
		var first = true;
		if (this.$itemsParent.children('.item.active').length > 1) {
			this.$itemsParent.children('.item.active').each(function(){
				if (first) return;
				$(this).removeClass('active');
			});
		}
		if (this.$itemsParent.children('.carousel-inner').length > 1) {
			first = true;
			this.$itemsParent.children('.carousel-inner').each(function(){
				if (first) return;
				$(this).detach();
			});
		}

		// adding wrapper
		this.$itemsParent.wrap('<div class="visor-wrapper" data-visor-align="' + options.align + '">');
		this.$wrapper = this.$itemsParent.parent();

		var self = this;
		this.$itemsParent.children('.item').each(function(idx) {
			$(this).attr('data-iid', idx);
			self.lastItemIid = idx;
		});

		// removing unnecessary white-spaces between items
		this.$itemsParent.contents().filter(function() {
			return this.nodeType == 3;
		}).detach();

		// multiplying items for 'center'-view to balance the list
		if (this.options.align == 'center' && this.$itemsParent.children('.item').length > 1) {
			var originalCollection = this.$itemsParent.children('.item'),
				firstChild = this.$itemsParent.children(':first-child');

			originalCollection.each(function() {
				$(this).clone().insertBefore(firstChild);
			});
		}
		this.$items = this.$itemsParent.children('.item');

		// emulating CSS parent selector for getting proper breakpoints
		this.$items.each(function() {
			if ($(this).is('.col-xs-1, .col-xs-2, .col-xs-3, .col-xs-4, .col-xs-5, .col-xs-6, .col-xs-7, .col-xs-8, .col-xs-9, .col-xs-10, .col-xs-11, .col-xs-12')) {
				self.$element.addClass('col-xs');
			}
			if ($(this).is('.col-sm-1, .col-sm-2, .col-sm-3, .col-sm-4, .col-sm-5, .col-sm-6, .col-sm-7, .col-sm-8, .col-sm-9, .col-sm-10, .col-sm-11, .col-sm-12')) {
				self.$element.addClass('col-sm');
			}
			if ($(this).is('.col-md-1, .col-md-2, .col-md-3, .col-md-4, .col-md-5, .col-md-6, .col-md-7, .col-md-8, .col-md-9, .col-md-10, .col-md-11, .col-md-12')) {
				self.$element.addClass('col-md');
			}
			if ($(this).is('.col-lg-1, .col-lg-2, .col-lg-3, .col-lg-4, .col-lg-5, .col-lg-6, .col-lg-7, .col-lg-8, .col-lg-9, .col-lg-10, .col-lg-11, .col-lg-12')) {
				self.$element.addClass('col-lg');
			}
		});

		// manage viewport resize
		var isInitialResize = true;
		var resizehandler = function() {
			self.disableControls();
			self.disableSliding();
			setTimeout(function() {
				// checking layout after redraw
				self.layout = getLayout.call(self);
				self.$element.attr('data-layout', self.layout);

				// aligning
				focusTo.call(self, self.$active);
				if (isInitialResize) {
					self.enableSliding();
					isInitialResize = false;
				}
				self.enableSliding();
				self.enableControls();
			}, 150);
		};
		resizehandler();
		this.$element.trigger('selected.bs.visorcarousel', [self.$active]);
		$(window).resize(resizehandler);

		this.options.keyboard && this.$element.on('keydown.bs.visorcarousel', $.proxy(this.keydown, this));

		this.options.pause == 'hover' && !('ontouchstart' in document.documentElement) && this.$element
			.on('mouseenter.bs.visorcarousel', $.proxy(this.pause, this))
			.on('mouseleave.bs.visorcarousel', $.proxy(this.cycle, this))
		;
	};

	VisorCarousel.VERSION  = '1.0.0';

	VisorCarousel.TRANSITION_DURATION = 600;

	VisorCarousel.DEFAULTS = {
		interval: 5000,
		pause: 'hover',
		wrap: true,
		keyboard: true,
		align: 'center', // 'top-left', 'center', 'bottom-right',
		anim: 'flip-in-out'
	};

	VisorCarousel.ANIMATIONS = {
		'flip-in-out': {
			fold: function(visor, $item) {
				var $result;
				$result = $item.addClass('fold').addClass('anim-flip-in-out').clone();
				$result._visor_original = $item;
				onAnimationEndOnce($item, function() {
					setTimeout(function() {
						$result.removeClass('raise').removeClass('anim-flip-in-out');
						$item.detach();
					}, 150); // awaiting for previous await and a bit more for sure
				});
				return $result;
			},
			raise: function(visor, $item) {
				$item.addClass('raise');
				setTimeout(function() {
					$item.removeClass('fold');
				}, 100); // awaiting for node to be placed on DOM
				return $item;
			}
		}
	};

	// UTILITY FUNCTIONS DEFINITION
	// ============================

	function px2num(px) {
		if (!px) return 0;
		return Math.round(parseFloat(px.replace('px', '')));
	}

	function onAnimationEndOnce($el, cb) {
		$el.on('animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', cb);
		return $el;
	}

	function getLayout() {
		if (this.$items.length <= 1) {
			return 'landscape';
		} else {
			var chd1st = this.$itemsParent.children('.item:first-child'),
				chdLst = this.$itemsParent.children('.item:last-child');
			if (chdLst.offset().left > chd1st.offset().left) {
				this.$itemsParent.css({
					'top': '',
					'bottom': ''
				});
				return 'landscape';
			}

			this.$itemsParent.css({
				'left': '',
				'right': ''
			});
			return 'portrait';
		}
	}

	function focusTo($item) {
		var spaceBeforeActive = 0,
			spaceAfterActive = 0,
			itemSpace = 0,
			wrapperSpace = 0,
			self = this;

		this.$itemsParent.children('.item.active').removeClass('active');
		self.$active = $item.addClass('active');

		this.$indicators.children('.active').removeClass('active');
		this.$indicators.children('[data-slide-to=' + $item.data('iid') + ']').addClass('active');

		var isActiveReached = false;
		this.$itemsParent.children('.item').each(function() {
			var fn = 'outerHeight',
				$this = $(this);
			if (self.layout == 'landscape') {
				fn = 'outerWidth';
			}
			if (!isActiveReached) {
				if ($this.hasClass('active')) {
					itemSpace = $this[fn]();
					wrapperSpace = self.$wrapper[fn == 'outerHeight'? 'height' : 'width']();
					isActiveReached = true;
					return;
				}
				spaceBeforeActive += $this[fn]();
			} else {
				spaceAfterActive += $this[fn]();
			}
		});

		var cssProperty;
		switch (this.options.align) {
			case 'top-left': {
				cssProperty = 'top';
				if (this.layout == 'landscape') {
					cssProperty = 'left';
				}
				this.$itemsParent.css(cssProperty, '-' + spaceBeforeActive + 'px');
				break;
			}
			case 'bottom-right': {
				cssProperty = 'bottom';
				if (this.layout == 'landscape') {
					cssProperty = 'right';
				}
				this.$itemsParent.css(cssProperty, '-' + spaceAfterActive + 'px');
				break;
			}
			default:
			case 'center': {
				cssProperty = 'top';
				if (this.layout == 'landscape') {
					cssProperty = 'left';
				}
				this.$itemsParent.css(cssProperty, '-' + Math.round(((spaceBeforeActive + spaceAfterActive) / 2) - (wrapperSpace / 2)) - itemSpace + 'px');
				break;
			}
		}
	}

	VisorCarousel.prototype.slideTo = function($item) {
		if ($item.length != 1) return;
		if ($item.hasClass('active')) return;
		if (this.disableSliding()) return;

		var selectedIid = this.$items.index($item),
			activeIid = this.$items.index(this.$items.filter('.active')),
			isBackward = (activeIid > selectedIid),
			distance = 0,
			$items = this.$items,
			steps = 0, $lastItem,
			anim = this.options.anim,
			self = this;

		if (!isBackward) {
			distance = selectedIid - activeIid;
		} else {
			distance = activeIid - selectedIid;
			$items = $($items.get().reverse());
		}

		this.$element.trigger('slideto.bs.visorcarousel', [self.$active, $item]);
		var $toActive = $item;
		this.disableControls();
		this.disableSliding();
		for (steps=0; steps<distance; steps++) {
			(function() {
				var $slide = $lastItem = $($items.get(steps));

				$slide = VisorCarousel.ANIMATIONS[anim].fold(self, $slide);
				if (!isBackward) {
					$slide = VisorCarousel.ANIMATIONS[anim].raise(self, $slide.appendTo(self.$itemsParent));
				} else {
					$slide = VisorCarousel.ANIMATIONS[anim].raise(self, $slide.prependTo(self.$itemsParent));
				}
			}());
		}
		onAnimationEndOnce($lastItem, function() {
			setTimeout(function() {
				focusTo.call(self, $toActive); // selecting new active and make focused in view
				self.$items = self.$itemsParent.children('.item');
				self.enableControls();
				self.enableSliding();
				self.$element.trigger('selected.bs.visorcarousel', [self.$active]);
			}, 250);
		});

		return this;
	};

	VisorCarousel.prototype.select = function(slide, isRelative) {
		if (this.isSlidingDisabled()) return;

		isRelative = (typeof isRelative == 'boolean'? isRelative : false);
		var $items = this.$items,
			self = this,
			$toSlide,
			activeNth = 0,
			slideNth = 0,
			activeIid = 0;

		if ($.isNumeric(slide)) {
			// numeric slide means iid or relative distance
			slide = parseInt(slide);
			if (isRelative) {
				// by relative distance:
				activeNth = $items.filter('.active').index() + 1;
				slideNth = activeNth + slide;
				if (slideNth < 0) slideNth = 0;
				if (slideNth > $items.length) slideNth = $items.length;
			} else {
				// by iid:
				activeIid = $items.filter('.active').data('iid');
				activeNth = $items.filter('.active').index() + 1;
				if (slide > activeIid) {
					// stepping forward
					slideNth = activeNth + slide - activeIid;
				} else {
					// stepping backward
					slideNth = activeNth - activeIid + slide;
				}
			}
			$toSlide = $items.filter(':nth-child(' + slideNth + ')');
		} else {
			// non-numeric slide means selector
			$toSlide = $items.filter(slide);
		}

		this.$element.trigger('select.bs.visorcarousel', [this.$active, $toSlide]);
		this.slideTo($toSlide);

		return this;
	};

	VisorCarousel.prototype.enableControls = function() {
		this.$element.find('[data-slide], [data-slide-to], [data-slide-by]').removeClass('disabled');
		this.disabledControls = false;
	};

	VisorCarousel.prototype.disableControls = function () {
		this.$element.find('[data-slide], [data-slide-to], [data-slide-by]').addClass('disabled');
		this.disabledControls = true;
	};

	VisorCarousel.prototype.isControlsDisabled = function() {
		return this.disabledControls;
	};

	VisorCarousel.prototype.enableSliding = function() {
		this.disabledSliding = false;
	};

	VisorCarousel.prototype.disableSliding = function() {
		this.disabledSliding = true;
	};

	VisorCarousel.prototype.isSlidingDisabled = function() {
		return this.disabledSliding;
	};

	VisorCarousel.prototype.prev = function() {
		this.select(-1, true);
		return this;
	};

	VisorCarousel.prototype.next = function() {
		this.select(1, true);
		return this;
	};

	VisorCarousel.prototype.first = function() {
		this.select(0);
		return this;
	};

	VisorCarousel.prototype.last = function() {
		this.select(this.lastItemIid);
		return this;
	};

	VisorCarousel.prototype.pause = function() {
		if (this.slidingTimer) clearInterval(this.slidingTimer);
		return this;
	};

	VisorCarousel.prototype.cycle = function() {
		var self = this;
		if (this.options.interval == 0) return;
		this.slidingTimer = setInterval(function() {
			if (!self.isSlidingDisabled()) self.select(1, true);
		}, this.options.interval);
		return this;
	};

	VisorCarousel.prototype.setInterval = function (interval) {
		var self = this;

		if (this.slidingTimer) clearInterval(this.slidingTimer);
		this.options.interval = interval;

		if (this.options.interval == 0) return this;

		this.slidingTimer = setInterval(function() {
			if (!self.isSlidingDisabled()) self.select(1, true);
		}, this.options.interval);

		return this;
	};

	// VISOR CAROUSEL PLUGIN DEFINITION
	// ================================

	function Plugin(option) {
		return this.each(function () {
			var $this	= $(this);
			var obj		= $this.data('bs.visorcarousel');
			var options	= $.extend({}, VisorCarousel.DEFAULTS, $this.data(), typeof option == 'object' && option);
			var action	= options.slide || false;

			if (!obj) $this.data('bs.visorcarousel', (obj = new VisorCarousel(this, options)));
			if ($.isPlainObject(option)) {
				if (options.slide) {
					obj[action]();
				} else {
					if (typeof options.slideTo != 'undefined' && options.slideTo !== null) {
						obj.select(options.slideTo, false);
					} else if (typeof options.slideBy != 'undefined' && options.slideBy !== null) {
						obj.select(options.slideBy, true);
					}
				}
			}
			if (options.interval == 0) {
				obj.pause();
			} else {
				obj.pause().cycle();
			}
		});
	}

	var old = $.fn.visorCarousel;

	$.fn.visorcarousel             = Plugin;
	$.fn.visorcarousel.Constructor = VisorCarousel;


	// VISOR CAROUSEL NO CONFLICT
	// ==========================

	$.fn.carousel.noConflict = function () {
		$.fn.carousel = old;
		return this;
	};


	// VISOR CAROUSEL DATA-API
	// =======================

	var clickHandler = function (e) {
		var href;
		var $this   = $(this);
		var $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')); // strip for ie7
		if (!$target.hasClass('visor-carousel')) return;
		var options = $.extend({}, $target.data(), $this.data());
		var slideIndex = $this.attr('data-slide-to') || $this.attr('data-slide-by') || $this.attr('data-slide') || false;
		if (slideIndex) options.interval = false;

		$target.data('bs.visorcarousel').pause();
		Plugin.call($target, options);

		e.preventDefault();
	};

	$(document)
		.on('click.bs.visorcarousel.data-api', '[data-slide]', clickHandler)
		.on('click.bs.visorcarousel.data-api', '[data-slide-to]', clickHandler)
		.on('click.bs.visorcarousel.data-api', '[data-slide-by]', clickHandler)
	;

	$(window).on('load.bs.visorcarousel.data-api', function () {
		$('[data-ride="visor"]').each(function () {
			var $carousel = $(this);
			Plugin.call($carousel, $carousel.data());
		});
	});

}(jQuery);