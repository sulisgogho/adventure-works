import os
import glob

views_dir = os.path.join("frontend", "src", "views")
for filepath in glob.glob(os.path.join(views_dir, '*.jsx')):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace("('/api/sales')", "('/api/sales.json')")
    new_content = new_content.replace("('/api/logistics')", "('/api/logistics.json')")
    new_content = new_content.replace("('/api/ppic')", "('/api/ppic.json')")
    
    new_content = new_content.replace("('/api/analytics/b2c')", "('/api/analytics/b2c.json')")
    new_content = new_content.replace("('/api/analytics/callcenter')", "('/api/analytics/callcenter.json')")
    new_content = new_content.replace("('/api/analytics/sentiment')", "('/api/analytics/sentiment.json')")
    new_content = new_content.replace("('/api/analytics/finance')", "('/api/analytics/finance.json')")
    new_content = new_content.replace("('/api/analytics/hr')", "('/api/analytics/hr.json')")
    new_content = new_content.replace("('/api/analytics/territory')", "('/api/analytics/territory.json')")
    new_content = new_content.replace("('/api/analytics/promotion')", "('/api/analytics/promotion.json')")

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")
print('Endpoints updated!')
