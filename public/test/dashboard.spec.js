describe("dashboard", function(){
    it("should be there", function(){
        expect(IATI.dashboard).toBeDefined();
    });
});

describe("widgets", function(){
  
  beforeEach(function(){
    IATI.dashboard.clear();
  });
  
  it('a widget can be added to the dashboard', function(){
    
    IATI.dashboard.add('widgets', 'http://my-widget-url');
    
    expect(IATI.dashboard.get('widgets').length).toBe(1);
    
    expect(IATI.dashboard.get('widgets')[0]).toBe('http://my-widget-url');
    
  });
  
  
});

describe("persitance", function(){
  
  beforeEach(function(){
    IATI.dashboard.clear();
  });
  
  it('should persist the dashboard to localStorage on add', function(){
    
    IATI.dashboard.add('widgets', 'url');
    
    expect(window.localStorage.getItem('dashboard')).toBe(JSON.stringify({widgets:['url']}));
    
    IATI.dashboard.add('widgets', 'url2');
    
    expect(window.localStorage.getItem('dashboard')).toBe(JSON.stringify({widgets:['url','url2']}));
    
    
  });
});