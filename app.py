from flask import Flask, jsonify, render_template, request
from data_processor import RankingDataProcessor

app = Flask(__name__)
processor = RankingDataProcessor()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/available_years')
def available_years():
    all_years = []
    for system in processor.ranking_systems:
        years = processor.get_available_years(system)
        all_years.extend(years)
    # 去重和排序
    all_years = sorted(list(set(all_years)), reverse=True)
    return jsonify(all_years)

@app.route('/api/rankings/<int:year>')
def rankings_by_year(year):
    all_rankings = processor.get_all_rankings()
    year_data = {}
    for system in processor.ranking_systems:
        if system == 'ARWU' and year == 2025:
            year_data[system] = []  # 2025年ARWU数据为空
        elif year in all_rankings.get(system, {}):
            year_data[system] = all_rankings[system][year].to_dict('records')
        else:
            year_data[system] = []  # 其他年份如果数据不存在也返回空列表

    return jsonify(year_data)

@app.route('/api/search')
def search_university():
    query = request.args.get('query', '').strip().lower()
    year = request.args.get('year', type=int)
    
    if not query:
        return jsonify({'error': '请输入搜索关键词'}), 400
    if not year:
        return jsonify({'error': '请选择年份'}), 400

    all_rankings = processor.get_all_rankings()
    results = {}
    
    for system in processor.ranking_systems:
        # 处理2025年ARWU数据特殊情况
        if system == 'ARWU' and year == 2025:
            continue
            
        system_data = all_rankings.get(system, {})
        if year not in system_data:
            continue
            
        df = system_data[year]
        # 模糊匹配大学名称
        matched_universities = df[df['University'].str.lower().str.contains(query, na=False)]
        if not matched_universities.empty:
            results[system] = {
                'year': year,
                'data': matched_universities[['University', 'World_Rank']].to_dict('records')
            }
    
    return jsonify(results)

@app.route('/api/compare')
def compare_universities():
    universities = request.args.getlist('universities[]')
    year = request.args.get('year', type=int)
    
    if not universities:
        return jsonify({'error': '请输入要对比的大学'}), 400
    if not year:
        return jsonify({'error': '请选择年份'}), 400
    if len(universities) > 5:
        return jsonify({'error': '最多只能对比5所大学'}), 400

    all_rankings = processor.get_all_rankings()
    results = {}
    
    # 对每所大学进行搜索
    for university in universities:
        university = university.strip().lower()
        if not university:
            continue
            
        university_results = {}
        for system in processor.ranking_systems:
            # 处理2025年ARWU数据特殊情况
            if system == 'ARWU' and year == 2025:
                university_results[system] = {'rank': '-', 'name': '-'}
                continue
                
            system_data = all_rankings.get(system, {})
            if year not in system_data:
                university_results[system] = {'rank': '-', 'name': '-'}
                continue
                
            df = system_data[year]
            # 模糊匹配大学名称
            matched_universities = df[df['University'].str.lower().str.contains(university, na=False)]
            if not matched_universities.empty:
                # 取第一个匹配结果
                first_match = matched_universities.iloc[0]
                university_results[system] = {
                    'rank': first_match['World_Rank'],
                    'name': first_match['University']
                }
            else:
                university_results[system] = {'rank': '-', 'name': '-'}
        
        # 只有当至少有一个排名系统找到了这所大学时才添加结果
        if any(result['name'] != '-' for result in university_results.values()):
            results[university] = university_results
    
    return jsonify({
        'year': year,
        'results': results
    })

@app.route('/api/trend')
def get_university_trend():
    query = request.args.get('university', '').strip()
    
    if not query:
        return jsonify({'error': '请输入大学名称'}), 400

    all_rankings = processor.get_all_rankings()
    results = {
        'ARWU': {},
        'QS': {},
        'THE': {}
    }
    university_name = None
    
    # 对每个排名系统获取历年数据
    for system in processor.ranking_systems:
        system_data = all_rankings.get(system, {})
        for year in sorted(system_data.keys()):
            df = system_data[year]
            # 精确匹配大学名称
            matched_universities = df[df['University'] == query]
            if not matched_universities.empty:
                first_match = matched_universities.iloc[0]
                results[system][year] = {
                    'rank': first_match['World_Rank'],
                    'name': first_match['University']
                }
                # 使用找到的第一个完整名称作为标准名称
                if not university_name and first_match['University']:
                    university_name = first_match['University']
    
    # 如果没有找到任何数据，返回错误
    if not university_name:
        return jsonify({'error': '未找到匹配的大学，请确保输入完整的大学名称'}), 404
    
    # 处理排名数据，将字符串类型的排名转换为数值
    for system in results:
        for year in results[system]:
            rank = results[system][year]['rank']
            if isinstance(rank, str) and '-' in rank:
                # 处理范围形式的排名（如"151-200"），取中间值
                try:
                    range_parts = rank.split('-')
                    if len(range_parts) == 2:
                        start = int(range_parts[0])
                        end = int(range_parts[1])
                        results[system][year]['rank'] = (start + end) // 2
                except ValueError:
                    results[system][year]['rank'] = None
            else:
                try:
                    results[system][year]['rank'] = int(rank)
                except (ValueError, TypeError):
                    results[system][year]['rank'] = None
    
    return jsonify({
        'university_name': university_name,
        'trend_data': results
    })

if __name__ == '__main__':
    app.run(debug=True) 