$(function() {

	// получение данных
	$.ajax({
		type:'GET',
		dataType:'jsonp',
		url:"http://api-fotki.yandex.ru/api/users/aig1001/album/63684/photos/?format=json&callback=eatme",
		success:function(data){
			parseAlbum(data);
		},
		error:function(){
			$('body').empty().append('<p class="error_msg">Скорее всего альбома больше не существует.</p>');
		}	
	});
	
	function parseAlbum(albumData){
		var albumTitle = albumData.title;
		var albumAuthor = albumData.author;
		var albumSize = albumData.imageCount;
		
		$('#navigation .preloader').remove();
		$('#navigation ul').width(albumSize*95);
		loadThumbnails(albumData, albumSize-1);		
	}

	
	function loadThumbnails(albumData, numStillToLoad){
		var numToLoadOnce = 100;
		
		if(numStillToLoad >= numToLoadOnce){
			numStillToLoad = numStillToLoad - 100;
		} else {
			numToLoadOnce = numStillToLoad;
			numStillToLoad = 0;
		}
		
		var photosArray = albumData.entries;
		
		for (var i=0; i < numToLoadOnce; i++) {
			var thumbImgLink = photosArray[i].img.XXS.href;
			var thumbImgAlt = photosArray[i].title;
			var imgLink = photosArray[i].img.L.href;
			var imgId = photosArray[i].id;
			var indexNumber = i;

			$('#navigation ul').append('<li id="'+indexNumber+'"><a full_link="'+imgLink+'" href="#'+imgId+'"><img src="'+thumbImgLink+'" alt="'+thumbImgAlt+'"></a></li>');
		}
		
		
		if (numStillToLoad !== 0){
			var photosArrayNextPart = albumData.links.next;
			
			$.ajax({
				type:'GET',
				dataType:'jsonp',
				url:photosArrayNextPart,
				success:function(data){
					loadThumbnails(data, numStillToLoad);
					// рекурсивно довызывается ф-я уже с новым json файлом, догружаются ещё 100 картинок (API выдаёт коллекции постранично) 
				},
				error:function(){
					alert('Ошибка, жаль, расходимся..');
				}	
			});
		} else {
			initGallery();
		}
	}


	var mainPreloader = $('#slides .preloader')
	function initGallery(){
		var loadHash = window.location.hash;

		if(loadHash.length > 0 && $('a[href="'+loadHash+'"]').length > 0) {
			navContainer.find('a[href="'+loadHash+'"]').trigger('click');
		} else {
			navContainer.find('li:first a').trigger('click');
			window.location.hash = '';
		}		
		
		mainPreloader.fadeOut(200);
	}	
	
	
	// анимация стрелок
	var arrowLeft = $('#arrows .prev');
	var arrowRight = $('#arrows .next');

	$(window).hover(function() {
		arrowLeft.stop().animate({ left: 35 }, 200);
		arrowRight.stop().animate({ right: 35 }, 200);
	}, function() {
		arrowLeft.stop().animate({ left: -50 }, 200);
		arrowRight.stop().animate({ right: -50 }, 200);
	});
	

	// анимация отображения навигации
	var navContainer = $('#navigation');
	var navContent = $('#navigation ul');
	
	navContainer.hover(function() {
		$('.wrap', this).stop().animate({ bottom: 0 }, 200);
	}, function() {
		$('.wrap', this).stop().animate({ bottom: -125 }, 200);
	});	
	
	navContainer.mousewheel(function(event, delta, deltaX, deltaY) {
		var currentLeftOffset = parseInt(navContent.css('left'));

		if (delta > 0) {
			navContent.stop().animate({ left: currentLeftOffset+190 }, 100);
		} else {
			navContent.stop().animate({ left: currentLeftOffset-190 }, 100);
		}

		return false;		
	});	
	

	// тач 
	navContainer.swipe({
		tap:function() {
			$('.wrap', this).stop().animate({ bottom: 0 }, 200);
		},
		swipeLeft:function(event, direction, distance, duration, fingerCount) {
			var currentLeftOffset = parseInt(navContent.css('left'));
			navContent.stop().animate({ left: currentLeftOffset-285 }, 200);
		},
		swipeRight:function(event, direction, distance, duration, fingerCount) {
			var currentLeftOffset = parseInt(navContent.css('left'));
			navContent.stop().animate({ left: currentLeftOffset+285 }, 200);
		}		
	});	
	
	
	// навигация
	navContainer.one('click', 'a', switchImage);
	
	function switchImage(){
		var direction = 'forward';
		var prevState = parseInt(navContainer.find('.current').attr('id'));
		var nextState = parseInt($(this).closest('li').attr('id'));
	
		if (nextState < prevState) {
			var direction = 'back';
		} else if (nextState === prevState){
			return false;
		}
	
		navContainer.find('.current').removeClass('current');
		$(this).closest('li').addClass('current');
		
		if ($('.current').is(':first-child')){
			arrowLeft.fadeOut(200);
			arrowRight.fadeIn(200);		
		} else if ($('.current').is(':last-child')){
			arrowRight.fadeOut(200);
			arrowLeft.fadeIn(200);
		} else if (arrowLeft.is(':hidden') || arrowRight.is(':hidden')){
			arrowLeft.fadeIn(200);
			arrowRight.fadeIn(200);		
		}
		
		
		var imgObject = $('#slides img');
		var imgLink = $(this).attr('full_link');
		var imgAlt = $('img', this).attr('alt');
		

		if (direction === 'forward') {
			var animationToSide = { 'left' : -3500 };
			var animationFromSide = { 'right' : 0 };
			var animationMidToProperty = 'left';
			var animationMidFromProperty = 'right';
		} else if (direction === 'back') {
			var animationToSide = { 'right' : -3500 };
			var animationFromSide = { 'left' : 0 };
			var animationMidToProperty = 'right';
			var animationMidFromProperty = 'left';
		}

		
		imgObject.animate( animationToSide, 300, function() {
			mainPreloader.delay(300).fadeIn(200);
		
			$(this).attr({
				alt: imgAlt,
				src: imgLink
			})
			.css(animationMidToProperty, '0')
			.css(animationMidFromProperty, '-3500px')
			.one('load', function() {
				$(this).animate( animationFromSide, 300, function() {
					mainPreloader.hide();
					navContainer.one('click', 'a', switchImage);
					// чтобы не скапливать переключения в очередь используется one, после конца всех анимаций вешается новый
				});
			})
			.each(function() {
				if(this.complete) $(this).load();
			});

		});	
		
		
		// подгрузятся следующая и предыдущая полные картинки
		var NextImgLink = $(this).closest('li').next().find('a').attr('full_link');
		var PrevImgLink = $(this).closest('li').prev().find('a').attr('full_link');
		preload([ NextImgLink, PrevImgLink ]);
	}
	
	
	function preload(arrayOfImages) {
		$(arrayOfImages).each(function(){
			$('<img/>')[0].src = this;
		});
	}	


	arrowLeft.click(function() {
		navContainer.find('.current').prev().find('a').trigger('click');
	});
	arrowRight.click(function() {
		navContainer.find('.current').next().find('a').trigger('click');
	});
	
});