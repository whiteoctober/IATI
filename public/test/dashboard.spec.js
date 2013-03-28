describe("dashboard", function(){
  it("should be there", function(){
      expect(IATI.dashboard).toBeDefined();
  });


  beforeEach(function(){
    IATI.dashboard.clear();
  });



  describe("widgets", function(){
    
    it('a widget can be added to the dashboard', function(){
      
      IATI.dashboard.add('widgets', 'http://my-widget-url');
      
      expect(IATI.dashboard.get('widgets').length).toBe(1);
      
      expect(IATI.dashboard.get('widgets')[0].href).toBe('http://my-widget-url');
      
    });

    it('should not add duplicate widgets', function(){


      IATI.dashboard.add('widgets', 'http://my-widget-url');
      IATI.dashboard.add('widgets', 'http://my-widget-url');

      expect(IATI.dashboard.get('widgets').length).toBe(1);


    })
    
    
  });

  describe("persitance", function(){
    
    it('should persist the dashboard to localStorage on add', function(){
      
      IATI.dashboard.add('widgets', 'url');
      
      expect(window.localStorage.getItem('dashboard')).toBe(JSON.stringify([{href:'url', key:'widgets'}]));
      
      IATI.dashboard.add('widgets', 'url2');
      
      expect(window.localStorage.getItem('dashboard')).toBe(JSON.stringify([{href:'url', key:'widgets'},{href:'url2', key:'widgets'}]));
      
      
    });
  });



  describe("containment", function(){
    
    it('should know if there is a url present', function(){
      
        IATI.dashboard.add('widgets', 'my-url');
        
        expect(IATI.dashboard.contains('my-url')).toBeTruthy();
        
        expect(IATI.dashboard.contains('not-my-url')).toBeFalsy();
        
    });
    
  });


  describe('content', function(){
    
    it('should add widgets', function(){
      
      IATI.dashboard.aadd({key:'widgets',href:'/activity/yeah',subkey:false});
      IATI.dashboard.aadd({key:'widgets',href:'/activity/ok',subkey:false});
      
      var dash = $('<section class="slide-panel dashboard"><h1 class="icn favourite large">My dashboard</h1><ol data-dashkey="activities" class="groups"><li class="info"><h3>Activities will be listed here when you press add to dashboard.</h3></li></ol><section data-dashkey="widgets"><h2>My widgets</h2><ol class="content"></ol></section><section data-dashkey="datafiles" class="datafiles"><h2>My data files</h2><ol class="content"></ol></section></section>');
      
      dash.dashboardContent();
      
      expect(dash.find('.content').children().size()).toBe(2);
      
      expect(dash.find('.content').children().first('iframe').html()||'').toContain('/activity/yeah');
      
      
    });
    
  });


  describe('favourite links', function(){
    
    /*it('should add to the dashboard', function(){
      $('<a href="link-url" class="favourite" data-dash="activities">').click();
      expect(IATI.dashboard.contains('activities')).toBeTruthy();
    });
    */
    
  });


});
