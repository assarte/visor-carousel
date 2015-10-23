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
		this.paused			= null;
		this.sliding		= null;
		this.interval		= null;
		this.$active		= null;
		this.$items			= null;
		this.layout			= null; // 'landscape', 'portrait'

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

		// multiplying items to balance the list
		var self = this;
		if (this.$itemsParent.children('.item').length > 1) {
			var isActiveReached = false;

			this.$itemsParent.children('.item').each(function () {
				var $this = $(this),
					prev = self.$itemsParent.children('.item.active').prev();

				if (!isActiveReached) {
					if ($this.hasClass('active')) {
						isActiveReached = true;
						return;
					}

					$this.clone().appendTo(self.$itemsParent);
				} else {
					if (prev.length == 0) {
						$this.clone().prependTo(self.$itemsParent);
					} else {
						$this.clone().insertAfter(prev);
					}
				}
			});
		}
		this.$items = this.$itemsParent.children('.item');

		// manage viewport resize
		var resizehandler = function() {
			setTimeout(function() {
				var maxWidth = 0;
				self.$wrapper.addClass('force-width');
				self.$itemsParent.width(''); // clear parent width

				self.$items.each(function() {
					var $this = $(this);
					$this.width(''); // clear calculated width
					$this.width($this.width());
					maxWidth += $this.outerWidth(true);
				});

				self.$itemsParent.width(maxWidth);
				self.$wrapper.removeClass('force-width');

				// checking layout after redraw
				self.layout = getLayout.call(self);
				self.$element.data('layout', self.layout);

				// aligning
				focusTo.call(self, self.$active);
			}, 150);
		};
		resizehandler();
		$(window).resize(resizehandler);

		this.options.keyboard && this.$element.on('keydown.bs.visorcarousel', $.proxy(this.keydown, this));

		this.options.pause == 'hover' && !('ontouchstart' in document.documentElement) && this.$element
			.on('mouseenter.bs.visorcarousel', $.proxy(this.pause, this))
			.on('mouseleave.bs.visorcarousel', $.proxy(this.cycle, this));
	};

	VisorCarousel.VERSION  = '1.0.0';

	VisorCarousel.TRANSITION_DURATION = 600;

	VisorCarousel.DEFAULTS = {
		interval: 5000,
		pause: 'hover',
		wrap: true,
		keyboard: true,
		align: 'center' // 'top-left', 'center', 'bottom-right'
	};

	// UTILITY FUNCTIONS DEFINITION
	// ============================

	function getLayout() {
		if (this.$items.length <= 1) {
			return 'landscape';
		} else {
			if (this.$itemsParent.children('.item:first-child').offset().top == this.$itemsParent.children('.item:nth-child(2)').offset().top) {
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
		$item.addClass('active');

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
				this.$itemsParent.css(cssProperty, '-' + Math.round(((spaceBeforeActive + spaceAfterActive + itemSpace) / 2) - (wrapperSpace / 2)) + 'px');
				break;
			}
		}

	}

	// VISOR CAROUSEL PLUGIN DEFINITION
	// ================================

	function Plugin(option) {
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data('bs.visorcarousel');
			var options = $.extend({}, VisorCarousel.DEFAULTS, $this.data(), typeof option == 'object' && option);
			var action  = typeof option == 'string' ? option : options.slide;

			if (!data) $this.data('bs.visorcarousel', (data = new VisorCarousel(this, options)));
			if (typeof option == 'number') data.to(option);
			else if (action) data[action]();
			else if (options.interval) data.pause().cycle();
		});
	}

	var old = $.fn.visorCarousel;

	$.fn.visorCarousel             = Plugin;
	$.fn.visorCarousel.Constructor = VisorCarousel;


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
		var slideIndex = $this.attr('data-slide-to');
		if (slideIndex) options.interval = false;

		Plugin.call($target, options);

		if (slideIndex) {
			$target.data('bs.visorcarousel').to(slideIndex);
		}

		e.preventDefault();
	};

	$(document)
		.on('click.bs.visorcarousel.data-api', '[data-slide]', clickHandler)
		.on('click.bs.visorcarousel.data-api', '[data-slide-to]', clickHandler);

	$(window).on('load', function () {
		$('[data-ride="visor"]').each(function () {
			var $carousel = $(this);
			Plugin.call($carousel, $carousel.data());
		});
	});

}(jQuery);