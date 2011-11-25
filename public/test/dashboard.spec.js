describe("dashboard", function(){
    it("should be there", function(){
        expect(IATI.dashboard).toBeDefined();
    });
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


describe('dashboard content', function(){
  
  it('should add widgets', function(){
    
    IATI.dashboard.add('widgets', 'my-url');
    IATI.dashboard.add('widgets', 'my-url2');
    
    var dash = $('<section class="dashboard"><ol class="groups"></ol><section class="widgets"><ol class="content"></ol></section><section class="datafiles"><ol class="content"></ol></section></section>');
    
    
    dash.dashboardContent();
    
    expect(dash.find('.widgets .content').children().size()).toBe(2);
    
    expect(dash.find('.widgets .content').children().first('iframe').html()).toContain('my-url');
    
    
  });
  
});


describe('favourite links', function(){
  
  it('should add to the dashboard', function(){
    $('<a href="link-url" class="favourite" data-dashkey="activities">').click();
    expect(IATI.dashboard.contains('link-url')).toBeTruthy();
  });
  
});