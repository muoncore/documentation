			jQuery(function($){
				
				$.supersized({
				
					// Functionality
					slideshow               :   1,			// Slideshow on/off
					autoplay				:	1,			// Slideshow starts playing automatically
					start_slide             :   1,			// Start slide (0 is random)
					stop_loop				:	0,			// Pauses slideshow on last slide
					random					: 	0,			// Randomize slide order (Ignores start slide)
					slide_interval          :   12000,		// Length between transitions
					transition              :   1, 			// 0-None, 1-Fade, 2-Slide Top, 3-Slide Right, 4-Slide Bottom, 5-Slide Left, 6-Carousel Right, 7-Carousel Left
					transition_speed		:	1000,		// Speed of transition
					new_window				:	1,			// Image links open in new window/tab
					pause_hover             :   0,			// Pause slideshow on hover
					keyboard_nav            :   1,			// Keyboard navigation on/off
					performance				:	1,			// 0-Normal, 1-Hybrid speed/quality, 2-Optimizes image quality, 3-Optimizes transition speed // (Only works for Firefox/IE, not Webkit)
					image_protect			:	1,			// Disables image dragging and right click with Javascript
															   
					// Size & Position						   
					min_width		        :   0,			// Min width allowed (in pixels)
					min_height		        :   0,			// Min height allowed (in pixels)
					vertical_center         :   1,			// Vertically center background
					horizontal_center       :   1,			// Horizontally center background
					fit_always				:	0,			// Image will never exceed browser width or height (Ignores min. dimensions)
					fit_portrait         	:   1,			// Portrait images will not exceed browser height
					fit_landscape			:   0,			// Landscape images will not exceed browser width
															   
					// Components							
					slide_links				:	'blank',	// Individual links for each slide (Options: false, 'num', 'name', 'blank')
					thumb_links				:	0,			// Individual thumb links for each slide
					thumbnail_navigation    :   0,			// Thumbnail navigation
					slides 					:  	[			// Slideshow Images
														{image : './images/slider/image1.jpg', title : 'Responsive Design <div class="slidedescription">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer lectus purus, tempus vel egestas sit amet, dignissim ac odio. Mauris at magna enim. Phasellus gravida faucibus ante, sit amet posuere neque pharetra quis. In cursus congue mattis. In hac habitasse platea dictumst. Duis sodales eleifend odio, suscipit sodales nibh aliquam vitae.</div>', thumb : '', url : 'http://themes.tvda.eu/'},
														{image : './images/slider/image3.jpg', title : 'Fullscreen gallery <div class="slidedescription">Nam at mauris eu dolor tincidunt faucibus sit amet ut lectus. Quisque quam leo, viverra a varius sed, gravida eget urna. Sed nec sem non mauris aliquam pulvinar. Vivamus sollicitudin blandit dui in consectetur. Ut et massa purus. Curabitur consectetur ipsum id elit tempus consectetur.</div>', thumb : '', url : 'http://themes.tvda.eu/'},
														{image : './images/slider/image2.jpg', title : 'Parallax Background <div class="slidedescription">Integer malesuada massa nec arcu porttitor mattis dapibus nisi elementum. Integer tincidunt imperdiet elit nec dapibus. Sed sed tortor in justo porttitor placerat vitae sed nibh. Phasellus interdum feugiat consequat. Nam iaculis dui vitae arcu adipiscing sagittis vehicula augue imperdiet.</div>', thumb : '', url : 'http://themes.tvda.eu/'},
														{image : './images/slider/image4.jpg', title : 'Showcase your work <div class="slidedescription">Pellentesque libero leo, molestie in congue sit amet, volutpat eu justo. Sed id arcu ac mauris ullamcorper fermentum. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Proin ultricies consequat mauris ut fermentum. Sed a urna a odio eleifend lacinia.</div>', thumb : '', url : 'http://themes.tvda.eu/'}  
												],
												
					// Theme Options			   
					progress_bar			:	0,			// Timer for each slide							
					mouse_scrub				:	0
					
				});
		    });
