-- ============================================================
-- 高校レベル問題 seed
-- source: live high questions after proofreading
-- ============================================================

DELETE FROM questions WHERE level = 'high';

INSERT INTO questions (level, sentence, japanese, words, punctuation, hint) VALUES
('high', 'It is important that we protect the environment .', '私たちが環境を守ることは重要です。', ARRAY['It', 'is', 'important', 'that', 'we', 'protect', 'the', 'environment'], '.', '仮主語構文'),
('high', 'Had I known the truth , I would have acted differently .', 'もし真実を知っていたら、違う行動をとっていたでしょう。', ARRAY['Had', 'I', 'known', 'the', 'truth', ',', 'I', 'would', 'have', 'acted', 'differently'], '.', '仮定法過去完了（倒置）'),
('high', 'It is said that the population of Japan is decreasing .', '日本の人口は減少していると言われています。', ARRAY['It', 'is', 'said', 'that', 'the', 'population', 'of', 'Japan', 'is', 'decreasing'], '.', 'It is said that = ～と言われている'),
('high', 'No matter how hard I try , I cannot solve this problem .', 'どんなに一生懸命やっても、この問題は解けません。', ARRAY['No', 'matter', 'how', 'hard', 'I', 'try', ',', 'I', 'cannot', 'solve', 'this', 'problem'], '.', 'No matter how = どんなに～でも'),
('high', 'I wish I could speak English more fluently .', 'もっと流暢に英語が話せればいいのに。', ARRAY['I', 'wish', 'I', 'could', 'speak', 'English', 'more', 'fluently'], '.', '仮定法（I wish I could）'),
('high', 'The more you practice , the better you will become .', '練習すればするほど、うまくなります。', ARRAY['The', 'more', 'you', 'practice', ',', 'the', 'better', 'you', 'will', 'become'], '.', 'the 比較級, the 比較級'),
('high', 'It goes without saying that health is more important than wealth .', '健康が富より大切なことは言うまでもありません。', ARRAY['It', 'goes', 'without', 'saying', 'that', 'health', 'is', 'more', 'important', 'than', 'wealth'], '.', 'It goes without saying that = ～は言うまでもない'),
('high', 'Having finished her work , she went home early .', '仕事を終えてから、彼女は早く帰宅しました。', ARRAY['Having', 'finished', 'her', 'work', ',', 'she', 'went', 'home', 'early'], '.', '完了分詞構文'),
('high', 'I would rather stay home than go out in this weather .', 'こんな天気に外出するよりも家にいたい。', ARRAY['I', 'would', 'rather', 'stay', 'home', 'than', 'go', 'out', 'in', 'this', 'weather'], '.', 'would rather A than B = BよりAしたい'),
('high', 'She was made to wait for more than an hour .', '彼女は1時間以上待たされました。', ARRAY['She', 'was', 'made', 'to', 'wait', 'for', 'more', 'than', 'an', 'hour'], '.', '使役受動態（be made to）'),
('high', 'What matters most is not what you say but what you do .', '最も大切なのは言葉ではなく行動です。', ARRAY['What', 'matters', 'most', 'is', 'not', 'what', 'you', 'say', 'but', 'what', 'you', 'do'], '.', '関係代名詞 what（名詞節）'),
('high', 'Despite his efforts , he failed to achieve his goal .', '努力にもかかわらず、彼は目標を達成できませんでした。', ARRAY['Despite', 'his', 'efforts', ',', 'he', 'failed', 'to', 'achieve', 'his', 'goal'], '.', 'despite = ～にもかかわらず（前置詞）'),
('high', 'The fact that he lied to us was a great disappointment .', '彼が嘘をついたという事実は大きな失望でした。', ARRAY['The', 'fact', 'that', 'he', 'lied', 'to', 'us', 'was', 'a', 'great', 'disappointment'], '.', '同格の that'),
('high', 'Not until midnight did the party come to an end .', '真夜中になってようやくパーティーが終わりました。', ARRAY['Not', 'until', 'midnight', 'did', 'the', 'party', 'come', 'to', 'an', 'end'], '.', '否定語句の倒置（Not until）'),
('high', 'It was not until he read the article that he understood the issue .', '記事を読んで初めて彼はその問題を理解しました。', ARRAY['It', 'was', 'not', 'until', 'he', 'read', 'the', 'article', 'that', 'he', 'understood', 'the', 'issue'], '.', 'It was not until ~ that = ～して初めて'),
('high', 'It is said that the population of Japan is decreasing .', '日本の人口は減少していると言われています。', ARRAY['It', 'is', 'said', 'that', 'the', 'population', 'of', 'Japan', 'is', 'decreasing'], '.', 'It is said that = ～と言われている'),
('high', 'No matter how hard I try , I cannot solve this problem .', 'どんなに一生懸命やっても、この問題は解けません。', ARRAY['No', 'matter', 'how', 'hard', 'I', 'try', ',', 'I', 'cannot', 'solve', 'this', 'problem'], '.', 'No matter how = どんなに～でも'),
('high', 'I wish I could speak English more fluently .', 'もっと流暢に英語が話せればいいのに。', ARRAY['I', 'wish', 'I', 'could', 'speak', 'English', 'more', 'fluently'], '.', '仮定法（I wish I could）'),
('high', 'The more you practice , the better you will become .', '練習すればするほど、うまくなります。', ARRAY['The', 'more', 'you', 'practice', ',', 'the', 'better', 'you', 'will', 'become'], '.', 'the 比較級, the 比較級'),
('high', 'It goes without saying that health is more important than wealth .', '健康が富より大切なことは言うまでもありません。', ARRAY['It', 'goes', 'without', 'saying', 'that', 'health', 'is', 'more', 'important', 'than', 'wealth'], '.', 'It goes without saying that = ～は言うまでもない'),
('high', 'Having finished her work , she went home early .', '仕事を終えてから、彼女は早く帰宅しました。', ARRAY['Having', 'finished', 'her', 'work', ',', 'she', 'went', 'home', 'early'], '.', '完了分詞構文'),
('high', 'I would rather stay home than go out in this weather .', 'こんな天気に外出するよりも家にいたい。', ARRAY['I', 'would', 'rather', 'stay', 'home', 'than', 'go', 'out', 'in', 'this', 'weather'], '.', 'would rather A than B = BよりAしたい'),
('high', 'She was made to wait for more than an hour .', '彼女は1時間以上待たされました。', ARRAY['She', 'was', 'made', 'to', 'wait', 'for', 'more', 'than', 'an', 'hour'], '.', '使役受動態（be made to）'),
('high', 'What matters most is not what you say but what you do .', '最も大切なのは言葉ではなく行動です。', ARRAY['What', 'matters', 'most', 'is', 'not', 'what', 'you', 'say', 'but', 'what', 'you', 'do'], '.', '関係代名詞 what（名詞節）'),
('high', 'Despite his efforts , he failed to achieve his goal .', '努力にもかかわらず、彼は目標を達成できませんでした。', ARRAY['Despite', 'his', 'efforts', ',', 'he', 'failed', 'to', 'achieve', 'his', 'goal'], '.', 'despite = ～にもかかわらず（前置詞）'),
('high', 'The fact that he lied to us was a great disappointment .', '彼が嘘をついたという事実は大きな失望でした。', ARRAY['The', 'fact', 'that', 'he', 'lied', 'to', 'us', 'was', 'a', 'great', 'disappointment'], '.', '同格の that'),
('high', 'Not until midnight did the party come to an end .', '真夜中になってようやくパーティーが終わりました。', ARRAY['Not', 'until', 'midnight', 'did', 'the', 'party', 'come', 'to', 'an', 'end'], '.', '否定語句の倒置（Not until）'),
('high', 'It was not until he read the article that he understood the issue .', '記事を読んで初めて彼はその問題を理解しました。', ARRAY['It', 'was', 'not', 'until', 'he', 'read', 'the', 'article', 'that', 'he', 'understood', 'the', 'issue'], '.', 'It was not until ~ that = ～して初めて'),
('high', 'It is important that we protect the environment .', '私たちが環境を守ることは重要です。', ARRAY['It', 'is', 'important', 'that', 'we', 'protect', 'the', 'environment'], '.', '仮主語構文'),
('high', 'Had I known the truth , I would have acted differently .', 'もし真実を知っていたら、違う行動をとっていたでしょう。', ARRAY['Had', 'I', 'known', 'the', 'truth', ',', 'I', 'would', 'have', 'acted', 'differently'], '.', '仮定法過去完了（倒置）');
