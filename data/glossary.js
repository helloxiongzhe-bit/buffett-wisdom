// 巴菲特知识库 - 投资术语词典
export const glossaryTerms = [
    { id: 1, term: '护城河', termEn: 'Economic Moat', category: '投资理念',
      definition: '指企业拥有的持久竞争优势，能够保护其利润免受竞争对手的侵蚀。巴菲特认为，拥有宽广护城河的企业才值得长期投资。护城河可以来自品牌优势、网络效应、成本优势、转换成本或政府特许权。',
      example: '可口可乐的品牌就是一条宽广的护城河——即使竞争对手可以复制配方，也无法复制品牌的影响力。' },
    { id: 2, term: '安全边际', termEn: 'Margin of Safety', category: '投资理念',
      definition: '由本杰明·格雷厄姆（Benjamin Graham）提出的核心概念。指以低于内在价值的价格买入资产，两者之间的差额就是安全边际。安全边际越大，投资的风险越小。',
      example: '如果一家公司的内在价值是每股100美元，以70美元买入，那么30美元就是安全边际。' },
    { id: 3, term: '内在价值', termEn: 'Intrinsic Value', category: '估值方法',
      definition: '企业在其剩余生命周期内能够产生的所有现金流的折现值。这是巴菲特评估企业价值的核心方法。内在价值是一个估计值，不同的人可能得出不同的结论。',
      example: '巴菲特说："内在价值是一个非常重要的概念，它为评估投资和企业的相对吸引力提供了唯一的逻辑手段。"' },
    { id: 4, term: '浮存金', termEn: 'Float', category: '保险业务',
      definition: '保险公司在收取保费后、支付理赔前持有的资金。这笔资金虽然不属于保险公司，但可以用于投资。伯克希尔的浮存金是其投资帝国的重要资金来源。',
      example: '截至2024年，伯克希尔的保险浮存金约为1690亿美元，这些资金被用于投资股票和收购企业。' },
    { id: 5, term: '复利', termEn: 'Compound Interest', category: '投资理念',
      definition: '利息产生利息的效应。爱因斯坦据说称复利为"世界第八大奇迹"。巴菲特的财富增长主要依靠复利效应——他99%以上的财富是在50岁以后积累的。',
      example: '如果每年获得20%的回报，10万美元在30年后将变成约2374万美元。' },
    { id: 6, term: '能力圈', termEn: 'Circle of Competence', category: '投资理念',
      definition: '指投资者真正理解的业务领域。巴菲特强调，投资者应该只在自己的能力圈内投资，知道自己不知道什么比知道什么更重要。',
      example: '巴菲特长期避开科技股，因为他认为科技行业不在他的能力圈内——直到他理解了苹果的消费品属性。' },
    { id: 7, term: '市盈率', termEn: 'P/E Ratio (Price-to-Earnings)', category: '估值方法',
      definition: '股票价格与每股收益的比率，是最常用的估值指标之一。市盈率越低，通常意味着股票越便宜，但需要结合企业的增长前景来判断。',
      example: '如果一家公司股价为100美元，每股收益为5美元，则市盈率为20倍。' },
    { id: 8, term: '自由现金流', termEn: 'Free Cash Flow (FCF)', category: '财务指标',
      definition: '企业在支付了所有运营费用和资本支出后剩余的现金。巴菲特更关注"所有者收益"（Owner Earnings），这与自由现金流类似但有细微差别。',
      example: '一家企业年收入10亿美元，运营成本7亿美元，资本支出1亿美元，则自由现金流为2亿美元。' },
    { id: 9, term: '价值投资', termEn: 'Value Investing', category: '投资理念',
      definition: '由本杰明·格雷厄姆创立的投资哲学，核心是以低于内在价值的价格买入证券。巴菲特在格雷厄姆的基础上进行了发展，更注重企业质量而非单纯的低价。',
      example: '巴菲特说："价格是你付出的，价值是你得到的。"' },
    { id: 10, term: '所有者收益', termEn: 'Owner Earnings', category: '财务指标',
      definition: '巴菲特提出的概念，等于净利润加上折旧摊销，减去维持性资本支出。这比会计利润更能反映企业的真实盈利能力。',
      example: '一家企业净利润1亿美元，折旧2000万美元，维持性资本支出3000万美元，则所有者收益为9000万美元。' },
    { id: 11, term: '商誉', termEn: 'Goodwill', category: '财务指标',
      definition: '收购价格超过被收购企业净资产公允价值的部分。巴菲特区分了经济商誉（企业的超额盈利能力）和会计商誉（资产负债表上的数字）。',
      example: '如果伯克希尔以100亿美元收购一家净资产为60亿美元的企业，则产生40亿美元的商誉。' },
    { id: 12, term: '资本配置', termEn: 'Capital Allocation', category: '企业管理',
      definition: '企业如何分配其资金的决策过程，包括再投资、收购、分红、回购等。巴菲特认为这是CEO最重要的工作之一。',
      example: '伯克希尔的资本配置选项包括：投资现有业务、收购新企业、购买股票、回购自身股票或持有现金。' },
    { id: 13, term: '市场先生', termEn: 'Mr. Market', category: '投资理念',
      definition: '格雷厄姆创造的比喻。市场先生每天都会出现，给你报一个价格来买卖股票。他的情绪波动很大——有时乐观，有时悲观。聪明的投资者应该利用市场先生的情绪，而不是被它左右。',
      example: '当市场先生恐慌性抛售时，正是价值投资者买入的好时机。' },
    { id: 14, term: '净资产收益率', termEn: 'ROE (Return on Equity)', category: '财务指标',
      definition: '净利润与股东权益的比率，衡量企业利用股东资金创造利润的效率。巴菲特偏好ROE持续高于15%的企业。',
      example: '如果一家企业净利润为1.5亿美元，股东权益为10亿美元，则ROE为15%。' },
    { id: 15, term: '保险承保利润', termEn: 'Underwriting Profit', category: '保险业务',
      definition: '保险公司收取的保费减去理赔支出和运营费用后的利润。大多数保险公司的承保业务是亏损的，但伯克希尔长期保持承保盈利。',
      example: '伯克希尔的保险业务不仅提供了巨额浮存金，还经常实现承保利润，相当于"被付费使用别人的钱"。' },
    { id: 16, term: '股票回购', termEn: 'Share Repurchase / Buyback', category: '企业管理',
      definition: '公司用自有资金在公开市场上购买自己的股票。当股价低于内在价值时，回购为留下的股东创造价值；反之则毁灭价值。',
      example: '伯克希尔在2020-2021年间回购了超过500亿美元的自身股票，因为巴菲特认为当时股价被低估。' }
];

export const glossaryCategories = ['全部', '投资理念', '估值方法', '财务指标', '保险业务', '企业管理'];

export function getTermsByCategory(category) {
    if (category === '全部') return glossaryTerms;
    return glossaryTerms.filter(t => t.category === category);
}

export function searchTerms(query) {
    const q = query.toLowerCase();
    return glossaryTerms.filter(t =>
        t.term.toLowerCase().includes(q) ||
        t.termEn.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
    );
}
