import prisma from './utils/prisma';
import { hashPassword } from './utils/auth';

async function main() {
  console.log('开始播种数据...');

  const passwordHash = await hashPassword('123456');

  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash,
      nickname: '测试用户',
      examStage: 3
    }
  });
  console.log('测试用户已创建:', testUser.email);

  const sampleArticles = [
    {
      title: 'AI Technology is Transforming the Future',
      sourceUrl: 'https://example.com/ai-future',
      sourceName: 'Tech News',
      category: '科技',
      originalContent: `Artificial intelligence is reshaping every industry. From healthcare to finance, AI systems are performing tasks that once required human intelligence. Machine learning algorithms can now diagnose diseases, predict market trends, and even create art.

The rapid development of AI technology brings both opportunities and challenges. While AI improves efficiency and opens new possibilities, it also raises important questions about privacy, ethics, and the future of work.

Researchers around the world are working to ensure that AI develops in a responsible way. They emphasize the importance of human oversight and the need for clear regulations to guide AI development.

As we move forward, the relationship between humans and AI will continue to evolve. The key is to use AI as a tool to enhance human capabilities rather than replace them.`,
      variants: [
        {
          level: 1,
          content: `AI is changing our world. Computers can now do many things. They help doctors and bankers.

AI is getting better every day. It can help us work faster. But we need to be careful with AI too.

Scientists are working hard to make AI safe. They want AI to help people.

We need to learn to work with AI. AI can help us do many things better.`,
          translation: `人工智能正在改变我们的世界。电脑现在可以做很多事情。它们帮助医生和银行家。

AI每天都在进步。它可以帮助我们更快地工作。但我们也需要小心使用AI。

科学家们正在努力使AI变得安全。他们希望AI能帮助人们。

我们需要学会与AI合作。AI可以帮助我们把很多事情做得更好。`
        },
        {
          level: 3,
          content: `Artificial intelligence is reshaping industries worldwide. From healthcare to finance, AI systems are performing tasks that previously required human intelligence. Machine learning algorithms can now diagnose diseases, predict market trends, and create original artwork.

The rapid development of AI technology presents both opportunities and challenges. While AI significantly improves efficiency and creates new possibilities, it also raises important questions about privacy, ethics, and employment.

Researchers globally are working to ensure responsible AI development. They emphasize the importance of human oversight and the need for clear regulations.

As we progress, the relationship between humans and AI will continue to evolve. The key is to use AI as a tool to enhance human capabilities rather than replace them entirely.`,
          translation: `人工智能正在重塑全球各行各业。从医疗保健到金融领域，AI系统正在执行过去需要人类智能的任务。机器学习算法现在可以诊断疾病、预测市场趋势，甚至创作原创艺术作品。

AI技术的快速发展既带来了机遇，也带来了挑战。虽然AI显著提高了效率并创造了新的可能性，但它也引发了关于隐私、伦理和就业的重要问题。

全球研究人员正在努力确保AI的负责任发展。他们强调人类监督的重要性以及明确法规的必要性。

随着我们不断前进，人类与AI之间的关系将继续演变。关键在于将AI用作增强人类能力的工具，而不是完全取代人类。`
        },
        {
          level: 5,
          content: `The exponential advancement of artificial intelligence is precipitating a paradigm shift across virtually every sector of the global economy. From precision medicine to algorithmic trading, AI systems are increasingly executing complex cognitive functions that were formerly the exclusive domain of human intelligence. Sophisticated machine learning architectures now facilitate disease diagnosis with remarkable accuracy, forecast market trajectories, and generate creative content indistinguishable from human-produced work.

This unprecedented technological evolution presents a dichotomy of unprecedented opportunities and formidable challenges. While AI substantially augments operational efficiency and unlocks novel avenues for innovation, it simultaneously engenders profound concerns regarding data privacy, algorithmic bias, ethical governance, and the future of the labor market.

The international research community is actively engaged in establishing frameworks for responsible AI deployment. Central to these efforts is the principle of meaningful human oversight and the development of robust regulatory mechanisms.

As we navigate this transformative era, the symbiotic relationship between human intelligence and artificial intelligence will continue to mature. The paramount objective is to leverage AI as an augmentative instrument that amplifies human potential, rather than a substitute for human cognition and creativity.`,
          translation: `人工智能的指数级发展正在引发全球经济几乎所有领域的范式转变。从精准医疗到算法交易，AI系统越来越多地执行复杂的认知功能，而这些功能以前是人类智能的专属领域。先进的机器学习架构现在能够以惊人的准确性进行疾病诊断、预测市场走向，并生成与人类创作难以区分的创意内容。

这一前所未有的技术演进呈现出前所未有的机遇和巨大挑战的二元性。虽然AI大幅提升了运营效率并开辟了创新的新途径，但它同时也引发了关于数据隐私、算法偏见、伦理治理和劳动力市场未来的深刻担忧。

国际研究界正在积极建立负责任的AI部署框架。这些努力的核心是有意义的人类监督原则和强大监管机制的发展。

在我们驾驭这个变革时代的过程中，人类智能与人工智能之间的共生关系将继续成熟。最重要的目标是将AI作为一种增强人类潜力的辅助工具，而不是人类认知和创造力的替代品。`
        }
      ],
      questions: [
        {
          question: 'What is the main idea of the article?',
          optionA: 'AI will replace all human jobs',
          optionB: 'AI is transforming industries and needs careful development',
          optionC: 'AI development should be stopped',
          optionD: 'AI only benefits the technology industry',
          correctAnswer: 'B',
          explanation: '文章讨论了AI对各行业的变革以及负责任发展的重要性。',
          type: 'main-idea'
        },
        {
          question: 'According to the passage, what is one challenge of AI?',
          optionA: 'It is too expensive',
          optionB: 'It raises questions about privacy and ethics',
          optionC: 'It works too slowly',
          optionD: 'It cannot learn new things',
          correctAnswer: 'B',
          explanation: '文中提到AI引发了关于隐私、伦理和就业未来的重要问题。',
          type: 'detail'
        },
        {
          question: 'What does the author suggest about the future of AI?',
          optionA: 'AI will completely replace humans',
          optionB: 'AI should be used to enhance human capabilities',
          optionC: 'AI development should not be regulated',
          optionD: 'AI will mainly benefit scientists',
          correctAnswer: 'B',
          explanation: '作者认为关键是将AI用作增强人类能力的工具，而不是取代人类。',
          type: 'inference'
        },
        {
          question: 'The word "exponential" in the last paragraph most likely means:',
          optionA: 'very slow',
          optionB: 'growing rapidly',
          optionC: 'dangerous',
          optionD: 'unexpected',
          correctAnswer: 'B',
          explanation: 'exponential意为"指数级的"，表示快速增长。',
          type: 'vocabulary'
        }
      ]
    },
    {
      title: 'Climate Change and Our Environment',
      sourceUrl: 'https://example.com/climate',
      sourceName: 'Environment Today',
      category: '环境',
      originalContent: `Climate change is one of the most pressing issues of our time. Rising temperatures, melting ice caps, and extreme weather events are all signs that our planet is warming at an alarming rate.

Scientists agree that human activities, particularly the burning of fossil fuels, are the primary cause of global warming. The emission of greenhouse gases traps heat in the atmosphere, leading to a gradual increase in average temperatures worldwide.

The consequences of climate change are far-reaching. They include rising sea levels, more frequent and intense natural disasters, disruption to food production, and threats to biodiversity. Many species face extinction as their habitats change faster than they can adapt.

Addressing climate change requires global cooperation. Countries need to work together to reduce emissions, transition to renewable energy sources, and develop sustainable practices. Individuals can also contribute by making environmentally conscious choices in their daily lives.

The good news is that momentum for action is growing. More governments, businesses, and individuals are recognizing the urgency of the situation and taking steps to reduce their carbon footprint. While the challenge is enormous, collective action can make a significant difference.`,
      variants: [
        {
          level: 1,
          content: `Our Earth is getting warmer. This is called climate change. The weather is becoming more extreme.

People cause climate change. We burn too much fuel. This makes the air trap heat.

Climate change is bad for animals and plants. Many homes are lost. The sea level is rising.

We need to work together. We should use clean energy. We can help the Earth every day.

Many people are starting to help. We can make things better if we all try.`,
          translation: `我们的地球正在变暖。这叫做气候变化。天气变得越来越极端。

人类造成了气候变化。我们燃烧了太多燃料。这使得空气留住了热量。

气候变化对动植物不利。许多栖息地消失了。海平面正在上升。

我们需要共同努力。我们应该使用清洁能源。我们每天都可以帮助地球。

很多人开始帮忙。如果我们都努力，我们可以让事情变得更好。`
        },
        {
          level: 3,
          content: `Climate change is one of the most critical challenges facing humanity today. Rising temperatures, melting polar ice, and increasingly extreme weather patterns clearly indicate that our planet is warming rapidly.

Scientists widely agree that human activities, especially the burning of fossil fuels like coal and oil, are the main driver of global warming. Greenhouse gas emissions trap heat in the atmosphere, causing average temperatures to rise steadily across the globe.

The impacts of climate change are extensive. They include rising sea levels, more frequent and severe natural disasters, disruptions to agriculture, and growing threats to biodiversity. Numerous species face extinction as their habitats change too quickly for them to adapt.

Tackling climate change demands international cooperation. Nations must collaborate to cut emissions, shift to renewable energy, and adopt sustainable practices. Individuals can also make a difference through environmentally friendly daily choices.

Encouragingly, momentum for action is building. More governments, companies, and people are recognizing the urgency and working to reduce their environmental impact. Although the challenge is massive, united effort can bring about meaningful change.`,
          translation: `气候变化是当今人类面临的最严峻挑战之一。气温上升、极地冰川融化以及日益极端的天气模式清楚地表明，我们的星球正在迅速变暖。

科学家们普遍认为，人类活动，特别是煤炭和石油等化石燃料的燃烧，是全球变暖的主要驱动因素。温室气体排放将热量困在大气中，导致全球平均气温稳步上升。

气候变化的影响是广泛的。包括海平面上升、更频繁更严重的自然灾害、农业中断以及对生物多样性日益增长的威胁。许多物种面临灭绝，因为它们的栖息地变化太快，无法适应。

应对气候变化需要国际合作。各国必须共同努力减少排放、转向可再生能源并采取可持续实践。个人也可以通过环保的日常选择产生影响。

令人鼓舞的是，行动的势头正在增强。更多的政府、企业和人们正在认识到紧迫性，并努力减少其环境影响。虽然挑战巨大，但共同努力可以带来有意义的改变。`
        },
        {
          level: 5,
          content: `Anthropogenic climate change represents one of the most existential challenges confronting contemporary civilization. Escalating global temperatures, accelerating cryospheric melting, and the amplification of extreme meteorological events provide incontrovertible evidence of unprecedented planetary warming.

The overwhelming consensus within the scientific community attributes climate change primarily to anthropogenic activities, most notably the combustion of fossil fuels and extensive deforestation. The resultant accumulation of greenhouse gases in the troposphere precipitates radiative forcing, driving a sustained increase in mean global temperatures.

The ramifications of climate change are multifaceted and cascading. They encompass eustatic sea-level rise, heightened frequency and intensity of climatological disasters, perturbations to global food security, and exacerbating threats to planetary biodiversity. Countless species confront imminent extinction as biomes undergo transformation at rates exceeding adaptive evolutionary capacity.

Mitigating climate change necessitates unprecedented multilateral collaboration. The international community must orchestrate coordinated efforts to decarbonize economies, effectuate the transition to renewable energy matrices, and institutionalize sustainable developmental paradigms. Individual behavioral modifications also constitute a critical component of comprehensive climate action.

Notwithstanding the magnitude of the challenge, there is growing momentum for concerted climate action. An increasing number of sovereign states, multinational corporations, and individual citizens are acknowledging the exigency of the crisis and implementing measures to curtail their carbon footprint. While the scale of the challenge is unprecedented, collective and sustained human agency can effectuate transformative change.`,
          translation: `人为气候变化是当代文明面临的最具生存性的挑战之一。全球气温不断攀升、冰冻圈加速融化以及极端气象事件的加剧，为前所未有的行星变暖提供了无可辩驳的证据。

科学界压倒性的共识将气候变化主要归因于人类活动，最显著的是化石燃料燃烧和大规模森林砍伐。由此产生的温室气体在对流层中的积累引发了辐射强迫，推动全球平均气温持续上升。

气候变化的后果是多方面的、级联式的。包括海平面均衡上升、气候灾害频率和强度增加、全球粮食安全受到干扰，以及行星生物多样性威胁加剧。无数物种面临即将灭绝的境地，因为生物群落正以超过适应性进化能力的速度发生变化。

缓解气候变化需要前所未有的多边合作。国际社会必须协调努力，实现经济脱碳，推动向可再生能源矩阵的转型，并将可持续发展范式制度化。个人行为改变也是全面气候行动的关键组成部分。

尽管挑战巨大，但协同气候行动的势头正在增强。越来越多的主权国家、跨国公司和公民个人正在认识到危机的紧迫性，并采取措施减少其碳足迹。虽然挑战的规模是前所未有的，但集体和持续的人类能动性可以实现变革性的改变。`
        }
      ],
      questions: [
        {
          question: 'What is the primary cause of climate change according to scientists?',
          optionA: 'Natural cycles of the Earth',
          optionB: 'Human activities like burning fossil fuels',
          optionC: 'Increased solar radiation',
          optionD: 'Volcanic eruptions',
          correctAnswer: 'B',
          explanation: '文章明确指出科学家认为人类活动，特别是化石燃料燃烧，是气候变化的主要原因。',
          type: 'detail'
        },
        {
          question: 'Which of the following is NOT mentioned as a consequence of climate change?',
          optionA: 'Rising sea levels',
          optionB: 'More natural disasters',
          optionC: 'Improved food production',
          optionD: 'Threats to biodiversity',
          correctAnswer: 'C',
          explanation: '文章提到气候变化会扰乱粮食生产，而不是改善粮食生产。',
          type: 'detail'
        },
        {
          question: 'The author\'s attitude towards addressing climate change can be described as:',
          optionA: 'Completely pessimistic',
          optionB: 'Cautiously optimistic',
          optionC: 'Entirely indifferent',
          optionD: 'Strongly opposed',
          correctAnswer: 'B',
          explanation: '作者承认挑战巨大，但指出行动势头正在增强，集体行动可以带来改变，态度是谨慎乐观的。',
          type: 'attitude'
        },
        {
          question: 'What does the word "exigency" most likely mean?',
          optionA: 'urgency',
          optionB: 'importance',
          optionC: 'difficulty',
          optionD: 'complexity',
          correctAnswer: 'A',
          explanation: 'exigency意为"紧急、迫切"，与urgency同义。',
          type: 'vocabulary'
        },
        {
          question: 'What is the author\'s main purpose in writing this passage?',
          optionA: 'To criticize governments for inaction',
          optionB: 'To inform readers about climate change and encourage action',
          optionC: 'To deny that climate change is real',
          optionD: 'To promote specific environmental products',
          correctAnswer: 'B',
          explanation: '文章的主要目的是向读者介绍气候变化并鼓励采取行动。',
          type: 'main-idea'
        }
      ]
    },
    {
      title: 'The Benefits of Daily Exercise',
      sourceUrl: 'https://example.com/exercise',
      sourceName: 'Health Magazine',
      category: '健康',
      originalContent: `Regular physical exercise is essential for maintaining good health and well-being. Studies consistently show that people who exercise regularly enjoy numerous physical and mental health benefits.

Physically, exercise strengthens the cardiovascular system, improves muscle tone, and helps maintain a healthy weight. It also boosts the immune system, reducing the risk of various illnesses including heart disease, diabetes, and certain cancers. Regular movement improves flexibility, balance, and overall physical fitness.

Mentally, exercise is equally important. Physical activity stimulates the release of endorphins, chemicals in the brain that act as natural mood lifters. This can help reduce symptoms of depression and anxiety. Regular exercise also improves cognitive function, including memory, attention, and problem-solving skills.

The good news is that you don\'t need intense workouts to benefit. Even moderate daily activities like walking, cycling, or swimming can make a significant difference. Experts recommend at least 30 minutes of moderate exercise most days of the week.

Developing a consistent exercise habit takes time and effort, but the rewards are well worth it. Starting small and gradually increasing intensity is the best approach. Finding an activity you enjoy makes it easier to stick with it long-term. Whether it\'s dancing, hiking, playing sports, or practicing yoga, there\'s an exercise for everyone.

Investing time in physical activity is one of the best things you can do for your health. The benefits extend beyond physical fitness to include improved mental health, better sleep, increased energy, and a longer, healthier life.`,
      variants: [
        {
          level: 1,
          content: `Exercise is good for you. It makes your body strong and healthy.

When you exercise, your heart gets stronger. You stay at a good weight. You get sick less often.

Exercise also makes you happy. Your brain makes you feel good. It helps you think better too.

You do not need to exercise hard. Walking or swimming is enough. Try 30 minutes every day.

Start slowly. Find something fun to do. There are many ways to exercise.

Exercise helps you live longer. It is one of the best things for your health.`,
          translation: `运动对你有好处。它使你的身体强壮健康。

当你运动时，你的心脏变得更强壮。你保持良好的体重。你更少生病。

运动也让你快乐。你的大脑会让你感觉良好。它也帮助你更好地思考。

你不需要剧烈运动。走路或游泳就足够了。尽量每天30分钟。

慢慢开始。找一些有趣的事情做。有很多种运动方式。

运动帮助你活得更久。这是对你健康最好的事情之一。`
        },
        {
          level: 3,
          content: `Regular physical exercise is fundamental to maintaining good health and overall well-being. Research consistently demonstrates that individuals who engage in regular exercise experience a wide range of physical and mental health benefits.

Physically, exercise strengthens the heart and cardiovascular system, improves muscle strength and tone, and helps maintain a healthy body weight. It also enhances immune function, reducing susceptibility to various illnesses including heart disease, type 2 diabetes, and certain types of cancer. Regular movement further improves flexibility, balance, and overall physical fitness levels.

Mentally, exercise is equally crucial. Physical activity triggers the release of endorphins—brain chemicals that act as natural mood elevators. This can help alleviate symptoms of depression and anxiety. Regular exercise also enhances cognitive function, including memory, concentration, and problem-solving abilities.

Fortunately, intense workouts are not necessary to reap these benefits. Even moderate daily activities such as brisk walking, cycling, or swimming can produce significant improvements. Health experts recommend at least 30 minutes of moderate exercise on most days of the week.

Building a consistent exercise habit requires dedication, but the benefits make it worthwhile. Starting with gentle activities and gradually increasing intensity is the most effective strategy. Choosing an enjoyable activity increases the likelihood of long-term adherence. Whether it\'s dancing, hiking, team sports, or yoga, there\'s a form of exercise suitable for everyone.

Investing time in physical activity is one of the most valuable investments you can make in your health. The advantages extend far beyond physical fitness to include improved mental health, better sleep quality, higher energy levels, and a longer, healthier lifespan.`,
          translation: `定期体育锻炼是保持良好健康和整体福祉的基础。研究一致表明，经常锻炼的人享有广泛的身心健康益处。

在身体上，运动增强心脏和心血管系统，改善肌肉力量和张力，并帮助维持健康体重。它还增强免疫功能，降低各种疾病的易感性，包括心脏病、2型糖尿病和某些类型的癌症。规律运动进一步改善柔韧性、平衡能力和整体体能水平。

在精神上，运动同样重要。身体活动会触发内啡肽的释放——这是大脑中作为天然情绪提升剂的化学物质。这有助于缓解抑郁和焦虑症状。定期运动还能增强认知功能，包括记忆力、注意力和解决问题的能力。

幸运的是，不需要剧烈运动就能获得这些益处。即使是适度的日常活动，如快走、骑自行车或游泳，也能产生显著的改善。健康专家建议每周大部分时间至少进行30分钟的适度运动。

建立持续的运动习惯需要投入，但这些益处使其物有所值。从温和的活动开始，逐渐增加强度是最有效的策略。选择喜欢的活动会增加长期坚持的可能性。无论是跳舞、徒步、团队运动还是瑜伽，总有一种适合每个人的运动方式。

投入时间进行体育活动是你可以对健康做出的最有价值的投资之一。这些好处远远超出了身体健康，包括改善心理健康、更好的睡眠质量、更高的能量水平以及更长、更健康的寿命。`
        },
        {
          level: 5,
          content: `Sustained physical exercise constitutes a cornerstone of holistic health maintenance and psychological well-being. Empirical research unequivocally demonstrates that individuals adhering to consistent exercise regimens experience a comprehensive spectrum of physiological and psychological benefits.

From a physiological perspective, exercise fortifies the cardiovascular apparatus, enhances musculoskeletal integrity, and facilitates healthy weight management. It also potentiates immune responsiveness, diminishing susceptibility to a panoply of morbidities including cardiovascular disease, type II diabetes mellitus, and various neoplastic conditions. Furthermore, regular physical activity ameliorates proprioceptive function, postural stability, and overall physical conditioning.

Psychologically, the salutary effects of exercise are equally profound. Physical exertion precipitates the secretion of endogenous endorphins—neurochemical compounds that function as natural anxiolytics and mood modulators. This biochemical response can mitigate symptomatic manifestations of clinical depression and anxiety disorders. Moreover, habitual exercise augments cognitive performance across multiple domains, including working memory, executive function, and fluid intelligence.

A particularly encouraging finding is that exhaustive exercise regimes are not prerequisite for deriving benefit. Even moderate daily activities—brisk walking, cycling, or aquatic exercise—can effectuate clinically significant improvements. Current epidemiological guidelines recommend a minimum of 150 minutes of moderate-intensity aerobic activity per week for optimal health outcomes.

Cultivating a sustainable exercise habit necessitates deliberate effort and gradual progression, yet the return on investment is substantial. Commencing with low-intensity activities and incrementally augmenting duration and intensity represents the evidence-based approach. Selecting intrinsically motivating activities substantially enhances long-term adherence. Whether dance, mountaineering, competitive athletics, or meditative movement practices like yoga, there exists a modality of physical activity suited to every individual predilection.

Allocating time to physical activity represents one of the most efficacious investments in personal health. The multifarious benefits extend well beyond mere physical fitness to encompass enhanced psychological resilience, improved sleep architecture, elevated energy homeostasis, and the prospect of increased longevity with preserved quality of life.`,
          translation: `持续的体育锻炼是整体健康维护和心理健康的基石。实证研究明确表明，坚持一贯锻炼方案的个人会体验到全面的生理和心理益处。

从生理学角度来看，运动强化心血管系统，增强肌肉骨骼完整性，并促进健康的体重管理。它还增强免疫反应性，降低对一系列疾病的易感性，包括心血管疾病、2型糖尿病和各种肿瘤疾病。此外，规律的体育活动改善本体感受功能、姿势稳定性和整体身体状况。

在心理上，运动的有益作用同样深远。体力消耗会促使内源性内啡肽的分泌——这些神经化学化合物作为天然抗焦虑剂和情绪调节剂。这种生化反应可以减轻临床抑郁症和焦虑症的症状表现。此外，习惯性运动在多个领域增强认知表现，包括工作记忆、执行功能和流体智力。

一个特别令人鼓舞的发现是，详尽的运动方案并非获得益处的先决条件。即使是适度的日常活动——快走、骑自行车或水上运动——也能产生临床上显著的改善。当前的流行病学指南建议每周至少进行150分钟中等强度的有氧运动，以获得最佳健康效果。

培养可持续的运动习惯需要深思熟虑的努力和渐进的过程，然而投资回报是巨大的。从低强度活动开始，逐步增加持续时间和强度是循证方法。选择内在激励的活动大大提高了长期坚持性。无论是舞蹈、登山、竞技体育还是瑜伽等冥想运动，都存在适合每个人喜好的体育活动方式。

投入时间进行体育活动是对个人健康最有效的投资之一。多种多样的益处远远超出了单纯的身体健康，包括增强的心理韧性、改善的睡眠结构、提升的能量稳态，以及延长寿命并保持生活质量的前景。`
        }
      ],
      questions: [
        {
          question: 'What are endorphins according to the passage?',
          optionA: 'A type of exercise',
          optionB: 'Brain chemicals that lift mood',
          optionC: 'A disease caused by lack of exercise',
          optionD: 'A method of weight loss',
          correctAnswer: 'B',
          explanation: '文中明确指出内啡肽是大脑中的化学物质，作为天然情绪提升剂。',
          type: 'detail'
        },
        {
          question: 'How much moderate exercise do experts recommend?',
          optionA: '10 minutes every day',
          optionB: 'At least 30 minutes most days',
          optionC: '2 hours once a week',
          optionD: '1 hour every day',
          correctAnswer: 'B',
          explanation: '专家建议每周大部分时间至少进行30分钟的适度运动。',
          type: 'detail'
        },
        {
          question: 'Which of the following best describes the author\'s tone?',
          optionA: 'Critical and negative',
          optionB: 'Informative and encouraging',
          optionC: 'Scientific and detached',
          optionD: 'Dramatic and sensational',
          correctAnswer: 'B',
          explanation: '作者以提供信息的方式介绍运动的好处，并鼓励读者开始锻炼，语气是告知性和鼓励性的。',
          type: 'attitude'
        },
        {
          question: 'The word "salutary" most likely means:',
          optionA: 'harmful',
          optionB: 'beneficial',
          optionC: 'surprising',
          optionD: 'unexpected',
          correctAnswer: 'B',
          explanation: 'salutary意为"有益的"，与beneficial同义。',
          type: 'vocabulary'
        }
      ]
    }
  ];

  for (const articleData of sampleArticles) {
    const existing = await prisma.article.findFirst({
      where: { title: articleData.title }
    });

    if (existing) {
      console.log('文章已存在，跳过:', articleData.title);
      continue;
    }

    const article = await prisma.article.create({
      data: {
        title: articleData.title,
        sourceUrl: articleData.sourceUrl,
        sourceName: articleData.sourceName,
        category: articleData.category,
        originalContent: articleData.originalContent
      }
    });
    console.log('创建文章:', article.title);

    for (const variant of articleData.variants) {
      const words = variant.content.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean).length;
      
      const articleVariant = await prisma.articleVariant.create({
        data: {
          articleId: article.id,
          difficultyLevel: variant.level,
          content: variant.content,
          translatedContent: variant.translation,
          wordCount: words
        }
      });
      console.log('  创建难度', variant.level, '变体');

      if (variant.level === 3 && articleData.questions) {
        for (let i = 0; i < articleData.questions.length; i++) {
          const q = articleData.questions[i];
          await prisma.quizQuestion.create({
            data: {
              articleVariantId: articleVariant.id,
              question: q.question,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              questionType: q.type,
              orderNum: i + 1
            }
          });
        }
        console.log('  创建', articleData.questions.length, '道题目');
      }
    }
  }

  console.log('数据播种完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
