interface OutfitSuggestionsProps {
  suggestions: string;
}

export const OutfitSuggestions = ({ suggestions }: OutfitSuggestionsProps) => {
  if (!suggestions.trim()) return null;

  const parseOutfits = (text: string) => {
    const outfits:any = [];
    
    const outfitSections = text.split(/\*\*Outfit Idea \d+:\*\*/);
    
    outfitSections.slice(1).forEach((section, index) => {
      const lines = section.trim().split('\n').filter(line => line.trim());
      
      let title = '';
      let items = [];
      let colorStyle = '';
      let whySuitable = '';
      let currentSection = '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (!title && index === 0) {
          title = lines[0]?.trim() || `Style ${index + 1}`;
        }
        
        if (trimmed.startsWith('**Clothing Items:**')) {
          currentSection = 'items';
          const itemsText = trimmed.replace('**Clothing Items:**', '').trim();
          if (itemsText) {
            items.push({
              category: 'Items',
              description: itemsText
            });
          }
          continue;
        } else if (trimmed.startsWith('**Color/Style:**')) {
          currentSection = 'color';
          colorStyle = trimmed.replace('**Color/Style:**', '').trim();
          continue;
        } else if (trimmed.startsWith('**Why it\'s suitable:**')) {
          currentSection = 'why';
          whySuitable = trimmed.replace('**Why it\'s suitable:**', '').trim();
          continue;
        }
        
        if (currentSection === 'color' && trimmed.length > 0 && !trimmed.startsWith('**')) {
          colorStyle += (colorStyle ? ' ' : '') + trimmed;
        } else if (currentSection === 'why' && trimmed.length > 0 && !trimmed.startsWith('**')) {
          whySuitable += (whySuitable ? ' ' : '') + trimmed;
        } else if (currentSection === 'items' && trimmed.length > 0 && !trimmed.startsWith('**')) {
          if (items.length === 0) {
            items.push({
              category: 'Items',
              description: trimmed
            });
          } else {
            items[0].description += ' ' + trimmed;
          }
        }
      }
      
      if (!title && lines.length > 0) {
        title = lines[0]?.replace(/^\*\*|\*\*$/g, '').trim() || `Style ${index + 1}`;
      }
      
      outfits.push({
        title: title,
        items: items.length > 0 ? items : [{
          category: 'Complete Outfit',
          description: 'See description below for details'
        }],
        colorStyle: colorStyle,
        whySuitable: whySuitable
      });
    });
    
    return outfits;
  };

  const outfits = parseOutfits(suggestions);
  
  if (outfits.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-orange-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 gradient-orange-button rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">✨</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Outfit Suggestions</h2>
        </div>
        <div className="prose prose-gray max-w-none">
          {suggestions.split('\n').map((line, index) => (
            <p key={index} className="text-gray-700 leading-relaxed">
              {line.trim()}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold gradient-orange-text mb-2">
          Outfit Suggestions ✨
        </h2>
        <p className="text-gray-600">Tailored to today's weather</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {outfits.map((outfit:any, index:any) => (
          <div key={index} className="bg-white rounded-2xl shadow-orange-lg overflow-hidden hover:shadow-orange-lg transition-shadow duration-300">
            <div className="gradient-orange-button p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-white bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <h3 className="text-xl font-bold">{outfit.title}</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {outfit.items.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange rounded-full"></span>
                    What to Wear
                  </h4>
                  <div className="space-y-2">
                    {outfit.items.map((item:any, itemIndex:any) => (
                      <div key={itemIndex} className="bg-orange-50 rounded-lg p-3">
                        <div className="font-medium text-orange-dark text-sm">
                          {item.category}
                        </div>
                        <div className="text-gray-700 text-sm leading-relaxed">
                          {item.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {outfit.colorStyle && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-800 rounded-full"></span>
                    Color & Style
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-lg p-3">
                    {outfit.colorStyle}
                  </p>
                </div>
              )}
              
              {outfit.whySuitable && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-light rounded-full"></span>
                    Perfect Because
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed bg-orange-light rounded-lg p-3">
                    {outfit.whySuitable}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};