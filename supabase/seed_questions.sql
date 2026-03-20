-- ============================================================
-- 英語ボックス — 追加問題データ
-- schema.sql を実行した後にこのファイルを実行してください
-- ============================================================

INSERT INTO questions (level, sentence, japanese, words, punctuation, hint) VALUES

-- ============================================================
-- BABY（2〜5歳）22問追加
-- 対象語彙：動物・色・形・食べ物・持ち物など2〜4語の短文
-- ============================================================
('baby', 'I have a ball .', 'わたしは ボールを もっています。',
  ARRAY['I', 'have', 'a', 'ball'], '.', 'ボール = ball'),

('baby', 'This is red .', 'これは あかいです。',
  ARRAY['This', 'is', 'red'], '.', 'あか = red'),

('baby', 'I like apples .', 'わたしは りんごが すきです。',
  ARRAY['I', 'like', 'apples'], '.', 'りんご = apples'),

('baby', 'I see a fish .', 'わたしは さかなを みます。',
  ARRAY['I', 'see', 'a', 'fish'], '.', 'さかな = fish'),

('baby', 'This is big .', 'これは おおきいです。',
  ARRAY['This', 'is', 'big'], '.', 'おおきい = big'),

('baby', 'I have a book .', 'わたしは ほんを もっています。',
  ARRAY['I', 'have', 'a', 'book'], '.', 'ほん = book'),

('baby', 'This is yellow .', 'これは きいろいです。',
  ARRAY['This', 'is', 'yellow'], '.', 'きいろ = yellow'),

('baby', 'I like milk .', 'わたしは ぎゅうにゅうが すきです。',
  ARRAY['I', 'like', 'milk'], '.', 'ぎゅうにゅう = milk'),

('baby', 'I see a bear .', 'わたしは くまを みます。',
  ARRAY['I', 'see', 'a', 'bear'], '.', 'くま = bear'),

('baby', 'This is small .', 'これは ちいさいです。',
  ARRAY['This', 'is', 'small'], '.', 'ちいさい = small'),

('baby', 'I have a pencil .', 'わたしは えんぴつを もっています。',
  ARRAY['I', 'have', 'a', 'pencil'], '.', 'えんぴつ = pencil'),

('baby', 'I like bananas .', 'わたしは バナナが すきです。',
  ARRAY['I', 'like', 'bananas'], '.', 'バナナ = bananas'),

('baby', 'This is green .', 'これは みどりです。',
  ARRAY['This', 'is', 'green'], '.', 'みどり = green'),

('baby', 'I see a flower .', 'わたしは おはなを みます。',
  ARRAY['I', 'see', 'a', 'flower'], '.', 'おはな = flower'),

('baby', 'I have a bag .', 'わたしは かばんを もっています。',
  ARRAY['I', 'have', 'a', 'bag'], '.', 'かばん = bag'),

('baby', 'This is pink .', 'これは ぴんくです。',
  ARRAY['This', 'is', 'pink'], '.', 'ぴんく = pink'),

('baby', 'I like cake .', 'わたしは ケーキが すきです。',
  ARRAY['I', 'like', 'cake'], '.', 'ケーキ = cake'),

('baby', 'I see a rabbit .', 'わたしは うさぎを みます。',
  ARRAY['I', 'see', 'a', 'rabbit'], '.', 'うさぎ = rabbit'),

('baby', 'This is a star .', 'これは ほしです。',
  ARRAY['This', 'is', 'a', 'star'], '.', 'ほし = star'),

('baby', 'I have a hat .', 'わたしは ぼうしを もっています。',
  ARRAY['I', 'have', 'a', 'hat'], '.', 'ぼうし = hat'),

('baby', 'I like juice .', 'わたしは ジュースが すきです。',
  ARRAY['I', 'like', 'juice'], '.', 'ジュース = juice'),

('baby', 'I see a sun .', 'わたしは おひさまを みます。',
  ARRAY['I', 'see', 'a', 'sun'], '.', 'おひさま = sun'),

-- ============================================================
-- ELEMENTARY（小学生）22問追加
-- 対象語彙：小1〜6で習う漢字・日常英会話・現在/過去形・比較
-- ============================================================
('elementary', 'I get up at seven every morning .', 'わたしは毎朝7時に起きます。',
  ARRAY['I', 'get', 'up', 'at', 'seven', 'every', 'morning'], '.', 'get up = おきる'),

('elementary', 'She likes reading books very much .', '彼女は本を読むのがとても好きです。',
  ARRAY['She', 'likes', 'reading', 'books', 'very', 'much'], '.', 'very much = とても'),

('elementary', 'We have lunch at school .', 'わたしたちは学校でお昼を食べます。',
  ARRAY['We', 'have', 'lunch', 'at', 'school'], '.', 'have lunch = ひるごはんを食べる'),

('elementary', 'My father is a doctor .', 'わたしのお父さんは医者です。',
  ARRAY['My', 'father', 'is', 'a', 'doctor'], '.', 'father = お父さん'),

('elementary', 'I want to be a teacher .', 'わたしは先生になりたいです。',
  ARRAY['I', 'want', 'to', 'be', 'a', 'teacher'], '.', 'want to be = ～になりたい'),

('elementary', 'Do you like English ?', 'あなたは英語が好きですか。',
  ARRAY['Do', 'you', 'like', 'English'], '?', 'Do you like ~? = ～が好きですか'),

('elementary', 'She plays the piano every day .', '彼女は毎日ピアノをひきます。',
  ARRAY['She', 'plays', 'the', 'piano', 'every', 'day'], '.', 'play the piano = ピアノをひく'),

('elementary', 'I studied English last night .', 'わたしは昨夜英語を勉強しました。',
  ARRAY['I', 'studied', 'English', 'last', 'night'], '.', 'last night = ゆうべ'),

('elementary', 'My mother cooks dinner every evening .', 'わたしのお母さんは毎晩夕食を作ります。',
  ARRAY['My', 'mother', 'cooks', 'dinner', 'every', 'evening'], '.', 'cook dinner = ゆうしょくを作る'),

('elementary', 'I have two brothers and one sister .', 'わたしには兄弟が二人と姉妹が一人います。',
  ARRAY['I', 'have', 'two', 'brothers', 'and', 'one', 'sister'], '.', 'brothers = きょうだい'),

('elementary', 'He runs in the park every morning .', '彼は毎朝公園で走ります。',
  ARRAY['He', 'runs', 'in', 'the', 'park', 'every', 'morning'], '.', 'run = はしる'),

('elementary', 'I drink milk every morning .', 'わたしは毎朝牛乳を飲みます。',
  ARRAY['I', 'drink', 'milk', 'every', 'morning'], '.', 'drink = のむ'),

('elementary', 'She speaks English very well .', '彼女はとても上手に英語を話します。',
  ARRAY['She', 'speaks', 'English', 'very', 'well'], '.', 'speak well = じょうずに話す'),

('elementary', 'We went to the zoo last Sunday .', 'わたしたちはこの前の日曜日に動物園に行きました。',
  ARRAY['We', 'went', 'to', 'the', 'zoo', 'last', 'Sunday'], '.', 'went = go の過去形'),

('elementary', 'I am good at swimming .', 'わたしは水泳が得意です。',
  ARRAY['I', 'am', 'good', 'at', 'swimming'], '.', 'be good at = ～が得意'),

('elementary', 'My birthday is in March .', 'わたしの誕生日は3月です。',
  ARRAY['My', 'birthday', 'is', 'in', 'March'], '.', 'birthday = たんじょうび'),

('elementary', 'I walked to school today .', 'わたしは今日歩いて学校に来ました。',
  ARRAY['I', 'walked', 'to', 'school', 'today'], '.', 'walked = walk の過去形'),

('elementary', 'He is taller than his brother .', '彼は兄より背が高いです。',
  ARRAY['He', 'is', 'taller', 'than', 'his', 'brother'], '.', 'taller than = ～より背が高い'),

('elementary', 'I want a new bicycle .', 'わたしは新しい自転車が欲しいです。',
  ARRAY['I', 'want', 'a', 'new', 'bicycle'], '.', 'bicycle = じてんしゃ'),

('elementary', 'We played tennis yesterday .', 'わたしたちは昨日テニスをしました。',
  ARRAY['We', 'played', 'tennis', 'yesterday'], '.', 'yesterday = きのう'),

('elementary', 'My favorite food is sushi .', 'わたしの好きな食べ物はすしです。',
  ARRAY['My', 'favorite', 'food', 'is', 'sushi'], '.', 'favorite = お気に入りの'),

('elementary', 'What is your name ?', 'あなたの名前は何ですか。',
  ARRAY['What', 'is', 'your', 'name'], '?', 'What is your name? = 名前は何ですか'),

-- ============================================================
-- JUNIOR（中学生）17問追加
-- 対象：現在完了・受動態・不定詞・関係代名詞・仮定法入門
-- ============================================================
('junior', 'I have never been to America .', '私はアメリカに一度も行ったことがありません。',
  ARRAY['I', 'have', 'never', 'been', 'to', 'America'], '.', '現在完了（経験の否定）'),

('junior', 'Have you finished your homework yet ?', 'あなたはもう宿題を終えましたか。',
  ARRAY['Have', 'you', 'finished', 'your', 'homework', 'yet'], '?', 'yet = もう（疑問文）'),

('junior', 'This book was written by a famous author .', 'この本は有名な作家によって書かれました。',
  ARRAY['This', 'book', 'was', 'written', 'by', 'a', 'famous', 'author'], '.', '受動態（by + 動作主）'),

('junior', 'If I were you , I would study harder .', 'もし私があなたなら、もっと一生懸命勉強するでしょう。',
  ARRAY['If', 'I', 'were', 'you', ',', 'I', 'would', 'study', 'harder'], '.', '仮定法過去'),

('junior', 'She told me that she was busy .', '彼女は私に忙しいと言いました。',
  ARRAY['She', 'told', 'me', 'that', 'she', 'was', 'busy'], '.', '間接話法（that節）'),

('junior', 'I don''t know what to do .', '私は何をすべきかわかりません。',
  ARRAY['I', 'don''t', 'know', 'what', 'to', 'do'], '.', '疑問詞＋to不定詞'),

('junior', 'He has lived in Tokyo since he was five .', '彼は5歳からずっと東京に住んでいます。',
  ARRAY['He', 'has', 'lived', 'in', 'Tokyo', 'since', 'he', 'was', 'five'], '.', '現在完了（継続）since'),

('junior', 'This is the book that I was looking for .', 'これが私が探していた本です。',
  ARRAY['This', 'is', 'the', 'book', 'that', 'I', 'was', 'looking', 'for'], '.', '関係代名詞 that'),

('junior', 'I am not as tall as my brother .', '私は兄ほど背が高くありません。',
  ARRAY['I', 'am', 'not', 'as', 'tall', 'as', 'my', 'brother'], '.', 'not as ~ as = ～ほど～でない'),

('junior', 'She asked me to help her .', '彼女は私に手伝ってほしいと頼みました。',
  ARRAY['She', 'asked', 'me', 'to', 'help', 'her'], '.', 'ask 人 to不定詞'),

('junior', 'I will call you when I get home .', '家に着いたら電話します。',
  ARRAY['I', 'will', 'call', 'you', 'when', 'I', 'get', 'home'], '.', '時の副詞節（when）は現在形'),

('junior', 'He speaks English as well as Japanese .', '彼は日本語と同じくらい上手に英語を話します。',
  ARRAY['He', 'speaks', 'English', 'as', 'well', 'as', 'Japanese'], '.', 'as well as = ～と同じくらい'),

('junior', 'I have just finished eating dinner .', '私はちょうど夕食を食べ終えたところです。',
  ARRAY['I', 'have', 'just', 'finished', 'eating', 'dinner'], '.', 'have just = ちょうど～したところ'),

('junior', 'It takes thirty minutes to get there by bike .', '自転車でそこへ行くのに30分かかります。',
  ARRAY['It', 'takes', 'thirty', 'minutes', 'to', 'get', 'there', 'by', 'bike'], '.', 'It takes 時間 to = ～するのに時間がかかる'),

('junior', 'I want you to come to my party .', '私はあなたに私のパーティーに来てほしいです。',
  ARRAY['I', 'want', 'you', 'to', 'come', 'to', 'my', 'party'], '.', 'want 人 to不定詞'),

('junior', 'She has been sick since last week .', '彼女は先週からずっと病気です。',
  ARRAY['She', 'has', 'been', 'sick', 'since', 'last', 'week'], '.', '現在完了（継続）'),

('junior', 'What time does the next train leave ?', '次の電車は何時に出発しますか。',
  ARRAY['What', 'time', 'does', 'the', 'next', 'train', 'leave'], '?', 'What time = 何時に'),

-- ============================================================
-- HIGH（高校生）13問追加
-- 対象：仮定法・倒置・分詞構文・関係詞・比較構文・慣用表現
-- ============================================================
('high', 'It is said that the population of Japan is decreasing .', '日本の人口は減少していると言われています。',
  ARRAY['It', 'is', 'said', 'that', 'the', 'population', 'of', 'Japan', 'is', 'decreasing'], '.', 'It is said that = ～と言われている'),

('high', 'No matter how hard I try , I cannot solve this problem .', 'どんなに一生懸命やっても、この問題は解けません。',
  ARRAY['No', 'matter', 'how', 'hard', 'I', 'try', ',', 'I', 'cannot', 'solve', 'this', 'problem'], '.', 'No matter how = どんなに～でも'),

('high', 'I wish I could speak English more fluently .', 'もっと流暢に英語が話せればいいのに。',
  ARRAY['I', 'wish', 'I', 'could', 'speak', 'English', 'more', 'fluently'], '.', '仮定法（I wish I could）'),

('high', 'The more you practice , the better you will become .', '練習すればするほど、うまくなります。',
  ARRAY['The', 'more', 'you', 'practice', ',', 'the', 'better', 'you', 'will', 'become'], '.', 'the 比較級, the 比較級'),

('high', 'It goes without saying that health is above wealth .', '健康が富より大切なことは言うまでもありません。',
  ARRAY['It', 'goes', 'without', 'saying', 'that', 'health', 'is', 'above', 'wealth'], '.', 'It goes without saying that = ～は言うまでもない'),

('high', 'Having finished her work , she went home early .', '仕事を終えてから、彼女は早く帰宅しました。',
  ARRAY['Having', 'finished', 'her', 'work', ',', 'she', 'went', 'home', 'early'], '.', '完了分詞構文'),

('high', 'I would rather stay home than go out in this weather .', 'こんな天気に外出するよりも家にいたい。',
  ARRAY['I', 'would', 'rather', 'stay', 'home', 'than', 'go', 'out', 'in', 'this', 'weather'], '.', 'would rather A than B = BよりAしたい'),

('high', 'She was made to wait for more than an hour .', '彼女は1時間以上待たされました。',
  ARRAY['She', 'was', 'made', 'to', 'wait', 'for', 'more', 'than', 'an', 'hour'], '.', '使役受動態（be made to）'),

('high', 'What matters most is not what you say but what you do .', '最も大切なのは言葉ではなく行動です。',
  ARRAY['What', 'matters', 'most', 'is', 'not', 'what', 'you', 'say', 'but', 'what', 'you', 'do'], '.', '関係代名詞 what（名詞節）'),

('high', 'Despite his efforts , he failed to achieve his goal .', '努力にもかかわらず、彼は目標を達成できませんでした。',
  ARRAY['Despite', 'his', 'efforts', ',', 'he', 'failed', 'to', 'achieve', 'his', 'goal'], '.', 'despite = ～にもかかわらず（前置詞）'),

('high', 'The fact that he lied to us was a great disappointment .', '彼が嘘をついたという事実は大きな失望でした。',
  ARRAY['The', 'fact', 'that', 'he', 'lied', 'to', 'us', 'was', 'a', 'great', 'disappointment'], '.', '同格の that'),

('high', 'Not until midnight did the party come to an end .', '真夜中になってようやくパーティーが終わりました。',
  ARRAY['Not', 'until', 'midnight', 'did', 'the', 'party', 'come', 'to', 'an', 'end'], '.', '否定語句の倒置（Not until）'),

('high', 'It was not until he read the article that he understood the issue .', '記事を読んで初めて彼はその問題を理解しました。',
  ARRAY['It', 'was', 'not', 'until', 'he', 'read', 'the', 'article', 'that', 'he', 'understood', 'the', 'issue'], '.', 'It was not until ~ that = ～して初めて'),

-- ============================================================
-- TOEIC（社会人）13問追加
-- 対象：ビジネスメール・会議・人事・契約・報告の定型表現
-- ============================================================
('toeic', 'All employees are required to submit their reports by Friday .', '全従業員は金曜日までに報告書を提出することが求められています。',
  ARRAY['All', 'employees', 'are', 'required', 'to', 'submit', 'their', 'reports', 'by', 'Friday'], '.', 'be required to = ～することが求められる'),

('toeic', 'The conference will be held at the Grand Hotel next month .', '会議は来月グランドホテルで開催されます。',
  ARRAY['The', 'conference', 'will', 'be', 'held', 'at', 'the', 'Grand', 'Hotel', 'next', 'month'], '.', 'be held = 開催される'),

('toeic', 'Please find attached the document you requested .', 'ご要望の書類を添付いたします。',
  ARRAY['Please', 'find', 'attached', 'the', 'document', 'you', 'requested'], '.', 'Please find attached = 添付ファイルをご確認ください'),

('toeic', 'We regret to inform you that your application has not been successful .', '誠に遺憾ながら、ご応募の結果についてお知らせいたします。',
  ARRAY['We', 'regret', 'to', 'inform', 'you', 'that', 'your', 'application', 'has', 'not', 'been', 'successful'], '.', 'regret to inform = ～をお伝えするのは遺憾'),

('toeic', 'The new policy will come into effect on the first of next month .', '新しい方針は来月1日から施行されます。',
  ARRAY['The', 'new', 'policy', 'will', 'come', 'into', 'effect', 'on', 'the', 'first', 'of', 'next', 'month'], '.', 'come into effect = 施行される'),

('toeic', 'Please do not hesitate to contact us if you have any questions .', 'ご質問がございましたら、遠慮なくご連絡ください。',
  ARRAY['Please', 'do', 'not', 'hesitate', 'to', 'contact', 'us', 'if', 'you', 'have', 'any', 'questions'], '.', 'do not hesitate to = 遠慮なく～してください'),

('toeic', 'The quarterly results exceeded our expectations by a significant margin .', '四半期の業績は大幅に予測を上回りました。',
  ARRAY['The', 'quarterly', 'results', 'exceeded', 'our', 'expectations', 'by', 'a', 'significant', 'margin'], '.', 'exceed expectations = 期待を上回る'),

('toeic', 'We are pleased to announce the launch of our new product line .', '新製品ラインの発表を喜んでお知らせします。',
  ARRAY['We', 'are', 'pleased', 'to', 'announce', 'the', 'launch', 'of', 'our', 'new', 'product', 'line'], '.', 'be pleased to = 喜んで～する'),

('toeic', 'Due to unforeseen circumstances , the event has been canceled .', '予期せぬ事情により、イベントは中止となりました。',
  ARRAY['Due', 'to', 'unforeseen', 'circumstances', ',', 'the', 'event', 'has', 'been', 'canceled'], '.', 'due to = ～のため'),

('toeic', 'The proposal was approved by the board of directors yesterday .', '昨日、取締役会で提案が承認されました。',
  ARRAY['The', 'proposal', 'was', 'approved', 'by', 'the', 'board', 'of', 'directors', 'yesterday'], '.', 'be approved by = ～によって承認される'),

('toeic', 'We look forward to hearing from you at your earliest convenience .', 'できるだけ早いご連絡をお待ちしております。',
  ARRAY['We', 'look', 'forward', 'to', 'hearing', 'from', 'you', 'at', 'your', 'earliest', 'convenience'], '.', 'look forward to = ～を楽しみに待つ'),

('toeic', 'The shipment is expected to arrive within three to five business days .', '荷物は3〜5営業日以内に到着する予定です。',
  ARRAY['The', 'shipment', 'is', 'expected', 'to', 'arrive', 'within', 'three', 'to', 'five', 'business', 'days'], '.', 'be expected to = ～する予定'),

('toeic', 'I am writing to express my interest in the position advertised on your website .', '御社ウェブサイトに掲載された求人に興味を持ちご連絡しております。',
  ARRAY['I', 'am', 'writing', 'to', 'express', 'my', 'interest', 'in', 'the', 'position', 'advertised', 'on', 'your', 'website'], '.', '応募メール冒頭の定型文');
