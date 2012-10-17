describe('fitText elements', function(){

	// 100x100 & 500x500 boxes
	var smallBox, largeBox;

	beforeEach(function(){
		smallBox = $('<div>').css({width:100, height:100});
		largeBox = $('<div>').css({width:500, height:500});

		smallBox.text("Lorem Ipsum And Stuff Yeah Yeah");
		largeBox.text("Lorem Ipsum And Stuff");

		smallBox.fitText();
		largeBox.fitText();

	});


	it('appended floats', function(){

		var left = smallBox.children().filter(function(){
			return $(this).css('float') == 'left';
		});

		expect(left.size()).toBeGreaterThan(0);

	});

	it('updated the text size', function(){
		expect(smallBox.css('fontSize')).not.toBe('');
	});

	it('resizes the text to fit within the bubble',function(){

		var smallTextSize = parseInt(smallBox.css('fontSize'),10);
		var largeTextSize = parseInt(largeBox.css('fontSize'),10);
		
		expect(smallTextSize).toBeLessThan(largeTextSize);

	});

	describe('subsequent applications', function(){
		var divsBefore;
		beforeEach(function(){
			divsBefore = smallBox.find('div').size();
			smallBox.fitText();
		});

		it('should not have inserted divs', function(){
			expect(smallBox.find('div').size()).toBe(divsBefore);
		});
	});


});