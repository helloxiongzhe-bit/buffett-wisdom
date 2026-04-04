// 巴菲特知识库 - 视频数据（股东大会视频已合并至股东大会页面）
export const videos = [
    {
        id: 3, category: '经典采访',
        title: '巴菲特：我的投资哲学 (CNBC专访)',
        titleEn: 'Buffett: My Investment Philosophy (CNBC Interview)',
        description: '巴菲特详细阐述了他的价值投资理念、能力圈原则和长期持有策略。',
        youtubeId: '2a9Lx9J8uSs',
        duration: '45:00',
        year: 2019
    },
    {
        id: 4, category: '经典采访',
        title: '查理·芒格：多元思维模型 (BBC纪录片)',
        titleEn: 'Charlie Munger: Mental Models (BBC Documentary)',
        description: '芒格分享了他的跨学科思维方法和人生智慧。',
        youtubeId: 'kLkCJMsEfHg',
        duration: '58:00',
        year: 2018
    },
    {
        id: 5, category: '演讲',
        title: '巴菲特在佛罗里达大学的演讲',
        titleEn: 'Buffett Lecture at University of Florida',
        description: '巴菲特在佛罗里达大学商学院的经典演讲，涵盖投资、职业选择和人生建议。',
        youtubeId: '2MHIcabnjrA',
        duration: '1:28:00',
        year: 1998
    },
    {
        id: 6, category: '演讲',
        title: '芒格在南加州大学毕业典礼演讲',
        titleEn: 'Munger USC Commencement Speech',
        description: '芒格分享了关于如何过上幸福生活的智慧，包括"反过来想"的思维方法。',
        youtubeId: '5U0TE4oqj8o',
        duration: '25:00',
        year: 2007
    },
    {
        id: 7, category: '纪录片',
        title: '成为沃伦·巴菲特 (HBO纪录片)',
        titleEn: 'Becoming Warren Buffett (HBO Documentary)',
        description: 'HBO制作的巴菲特传记纪录片，深入展现了巴菲特的生活、投资理念和慈善事业。',
        youtubeId: 'PB5krSvFAPY',
        duration: '1:28:00',
        year: 2017
    },
    {
        id: 8, category: '纪录片',
        title: '巴菲特与盖茨：改变世界的友谊',
        titleEn: 'Buffett & Gates: A Friendship That Changed the World',
        description: '记录巴菲特和比尔·盖茨之间深厚友谊以及他们共同推动的慈善事业。',
        youtubeId: 'mEkCYsALEBk',
        duration: '52:00',
        year: 2019
    },
    {
        id: 10, category: '经典采访',
        title: '巴菲特谈苹果投资 (CNBC 2023)',
        titleEn: 'Buffett on Apple Investment (CNBC 2023)',
        description: '巴菲特解释为什么苹果是伯克希尔最大的持仓，以及他对科技投资的看法。',
        youtubeId: 'XqGaBEMBcpE',
        duration: '32:00',
        year: 2023
    },
    {
        id: 11, category: '演讲',
        title: '巴菲特在哥伦比亚大学的演讲',
        titleEn: 'Buffett Lecture at Columbia University',
        description: '巴菲特回到母校，分享了他从格雷厄姆那里学到的投资智慧。',
        youtubeId: 'Pzz4lMbP0ZE',
        duration: '1:15:00',
        year: 2003
    },
    {
        id: 12, category: '纪录片',
        title: '巴菲特的投资秘诀',
        titleEn: 'Warren Buffett\'s Investment Secrets',
        description: '深入分析巴菲特的投资方法论，包括价值投资、护城河理论和资本配置。',
        youtubeId: 'jMuX-C1pB8c',
        duration: '48:00',
        year: 2020
    }
];

export const videoCategories = ['全部', '经典采访', '演讲', '纪录片'];

export function getVideosByCategory(category) {
    if (category === '全部') return videos;
    return videos.filter(v => v.category === category);
}
