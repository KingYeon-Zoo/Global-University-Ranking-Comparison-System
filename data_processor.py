import os
import pandas as pd
from typing import Dict, List, Optional 
from datetime import datetime

class RankingDataProcessor:
    """
    处理大学排名数据的类
    """
    def __init__(self, data_dir: str = "data"):
        """
        初始化数据处理器
        
        Args:
            data_dir: 数据文件夹路径
        """
        self.data_dir = data_dir
        self.ranking_systems = ["THE", "QS", "ARWU"]
        
    def read_ranking_data(self, system: str, year: int) -> Optional[pd.DataFrame]:
        """
        读取特定排名系统和年份的数据
        
        Args:
            system: 排名系统 (THE/QS/ARWU)
            year: 年份
            
        Returns:
            包含排名数据的DataFrame，如果文件不存在则返回None
        """
        if system not in self.ranking_systems:
            raise ValueError(f"不支持的排名系统: {system}")
            
        file_path = os.path.join(self.data_dir, system, f"{year}.csv")
        if not os.path.exists(file_path):
            return None
            
        try:
            # 添加参数处理多余列和分隔符问题
            df = pd.read_csv(file_path, sep=',', usecols=lambda col: "Unnamed" not in col)
            
            # 清理列名中的特殊字符
            df.columns = df.columns.str.replace(r'[#\s]', '', regex=True).str.strip()
            
            # 删除可能存在的空列
            df = df.dropna(axis=1, how='all')
            
            # 清理数据中的空格和缺失值
            for col in df.columns:
                if df[col].dtype == 'object':
                    df[col] = df[col].str.strip().replace({'NaN': '', 'nan': ''})
            
            # 重命名列（根据实际数据调整）
            df = df.rename(columns={
                'WorldRank': 'World_Rank',
                'Institution': 'University'
            })
            
            return df
        except Exception as e:
            print(f"读取文件 {file_path} 时出错: {str(e)}")
            return None
            
    def get_available_years(self, system: str) -> List[int]:
        """
        获取特定排名系统可用的年份列表
        
        Args:
            system: 排名系统 (THE/QS/ARWU)
            
        Returns:
            可用年份的列表
        """
        if system not in self.ranking_systems:
            raise ValueError(f"不支持的排名系统: {system}")
            
        system_dir = os.path.join(self.data_dir, system)
        if not os.path.exists(system_dir):
            return []
            
        years = []
        for file_name in os.listdir(system_dir):
            if file_name.endswith('.csv'):
                try:
                    year = int(file_name.split('.')[0])
                    years.append(year)
                except ValueError:
                    continue
        return sorted(years)
        
    def get_all_rankings(self) -> Dict[str, Dict[int, pd.DataFrame]]:
        """
        获取所有排名系统的所有年份数据
        
        Returns:
            包含所有排名数据的嵌套字典：{排名系统: {年份: DataFrame}}
        """
        all_rankings = {}
        for system in self.ranking_systems:
            years = self.get_available_years(system)
            system_data = {}
            for year in years:
                df = self.read_ranking_data(system, year)
                if df is not None:
                    system_data[year] = df
            all_rankings[system] = system_data
        return all_rankings

# 创建测试代码
if __name__ == "__main__":
    processor = RankingDataProcessor()
    
    # 测试获取可用年份
    for system in processor.ranking_systems:
        years = processor.get_available_years(system)
        print(f"{system} 可用年份: {years}")
    
    # 测试读取特定年份数据
    test_data = processor.read_ranking_data("QS", 2024)
    if test_data is not None:
        print("\nQS 2024年数据预览:")
        print(test_data) 