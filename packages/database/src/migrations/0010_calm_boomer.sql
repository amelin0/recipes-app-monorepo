CREATE TYPE "public"."notification_type" AS ENUM('reminder', 'system', 'subscription');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"subtitle" text,
	"items" jsonb,
	"meta_label" text,
	"action_label" text,
	"action_route" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faq_question_translations" (
	"question_id" uuid NOT NULL,
	"language" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	CONSTRAINT "faq_question_translations_question_id_language_pk" PRIMARY KEY("question_id","language")
);
--> statement-breakpoint
CREATE TABLE "faq_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faq_topic_translations" (
	"topic_id" uuid NOT NULL,
	"language" text NOT NULL,
	"title" text NOT NULL,
	CONSTRAINT "faq_topic_translations_topic_id_language_pk" PRIMARY KEY("topic_id","language")
);
--> statement-breakpoint
CREATE TABLE "faq_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faq_topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_question_translations" ADD CONSTRAINT "faq_question_translations_question_id_faq_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."faq_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_questions" ADD CONSTRAINT "faq_questions_topic_id_faq_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."faq_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faq_topic_translations" ADD CONSTRAINT "faq_topic_translations_topic_id_faq_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."faq_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");
--> statement-breakpoint
INSERT INTO "faq_topics" ("slug", "sort_order") VALUES
	('norms', 1),
	('usage', 2),
	('diet', 3),
	('results', 4),
	('health', 5),
	('account', 6),
	('technical', 7);--> statement-breakpoint
INSERT INTO "faq_topic_translations" ("topic_id", "language", "title")
SELECT t."id", v."language", v."title"
FROM "faq_topics" t
JOIN (VALUES
	('norms', 'uk', 'НОРМИ Й РОЗРАХУНКИ'),
	('usage', 'uk', 'ЯК КОРИСТУВАТИСЯ ЗАСТОСУНКОМ?'),
	('diet', 'uk', 'РЕЖИМ ХАРЧУВАННЯ'),
	('results', 'uk', 'МОЇ РЕЗУЛЬТАТИ'),
	('health', 'uk', 'ЗДОРОВ''Я ТА ОСОБЛИВІ ПЕРІОДИ'),
	('account', 'uk', 'АКАУНТ І ПІДПИСКА'),
	('technical', 'uk', 'ТЕХНІЧНІ ПИТАННЯ')
) AS v("slug", "language", "title") ON v."slug" = t."slug";--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 1 FROM "faq_topics" t WHERE t."slug" = 'norms'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Як формується моя денна норма калорій?', 'За науковою формулою: враховуємо стать, вік, зріст, вагу й один із п''яти рівнів фізичної активності. Це найпоширеніший у світі спосіб розрахунку.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 2 FROM "faq_topics" t WHERE t."slug" = 'norms'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Чи можна змінити калорійність і БЖВ вручну?', 'Так. У налаштуваннях норми є шкала - збільшуй або зменшуй калорії, білки, жири й вуглеводи під себе в будь-який момент.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 3 FROM "faq_topics" t WHERE t."slug" = 'norms'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Що враховує норма, а що ні?', 'Вона враховує твої фізичні дані та активність. Гормональний фон, перенесені хвороби й рівень стресу формула охопити не може - саме тому норму завжди можна скоригувати вручну.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 4 FROM "faq_topics" t WHERE t."slug" = 'norms'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Звідки беруться дані про продукти?', 'З офіційних баз даних про склад продуктів. Усі рецепти ми пишемо самі.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 5 FROM "faq_topics" t WHERE t."slug" = 'norms'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Звідки беруться ваші норми й рекомендації?', 'Ми спираємось на наукові дослідження та формули з найширшою доказовою базою. Це не «наша думка», а підхід, який працює для більшості людей.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 6 FROM "faq_topics" t WHERE t."slug" = 'norms'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Наскільки точна моя норма?', 'Вона порахована саме під твої дані: стать, вік, зріст, вагу й рівень активності. Для більшості людей цього достатньо, щоб отримати результат.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 7 FROM "faq_topics" t WHERE t."slug" = 'norms'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Я бачив(ла) інші цифри в інших джерелах', 'У нутриціології це нормально: різні джерела дають різні цифри, і наука постійно оновлюється. Ми обрали підхід із найсильнішою доказовою базою - той, що підтверджується на практиці.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 8 FROM "faq_topics" t WHERE t."slug" = 'norms'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Чи можу я налаштувати все під себе?', 'Так, і це звична практика. Норму калорій, БЖВ, кількість і час прийомів їжі можна змінити вручну - під свої звички або поради свого спеціаліста.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 9 FROM "faq_topics" t WHERE t."slug" = 'norms'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Коли варто підключити лікаря або дієтолога?', 'Коли є хронічні захворювання, гормональні особливості або коли хочеш підлаштувати раціон максимально точно. Застосунок бере на себе розрахунки й ритм, а спеціаліст додає те, що видно лише з твоїх аналізів.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 10 FROM "faq_topics" t WHERE t."slug" = 'norms'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Чи є сканування штрихкодів?', 'Поки що ні - працюємо над цим. Зараз продукт можна знайти в базі або додати вручну.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 1 FROM "faq_topics" t WHERE t."slug" = 'usage'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Як додати страву до раціону?', 'Натисни на потрібний прийом їжі, знайди рецепт за допомогою фільтрів і додай його. Кількість порцій змінюється прямо там.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 2 FROM "faq_topics" t WHERE t."slug" = 'usage'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Як створити власний рецепт?', 'Збери страву з продуктів, які маєш, або зміни будь-який готовий рецепт під себе. Твій варіант збережеться в застосунку.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 3 FROM "faq_topics" t WHERE t."slug" = 'usage'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Як обрати страву під свою норму?', 'Користуйся фільтрами й дивись на калорійність: найзручніше, коли страва вкладається в норму прийому плюс-мінус кілька калорій.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 4 FROM "faq_topics" t WHERE t."slug" = 'usage'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Як скласти план харчування на кілька днів?', 'Додай страви до потрібних днів у плануванні. Список покупок за цим планом сформується автоматично.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 5 FROM "faq_topics" t WHERE t."slug" = 'usage'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Як скласти план, щоб було найзручніше?', 'Ми радимо повторювати два-три дні поспіль. Так простіше закуповуватись і готувати раз на кілька днів, а не щодня по три-чотири рази.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 6 FROM "faq_topics" t WHERE t."slug" = 'usage'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Чи нормально їсти страви, приготовані наперед?', 'Цілком. Свіжоприготовлене трохи краще, але їжа, зроблена на два дні вперед, значно виграє в порівнянні з напівфабрикатом.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 7 FROM "faq_topics" t WHERE t."slug" = 'usage'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Як змінити кількість порцій?', 'Натисни на порцію у страві й обери потрібну кількість. Усі розрахунки оновляться автоматично.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 8 FROM "faq_topics" t WHERE t."slug" = 'usage'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Як налаштувати сповіщення?', 'У налаштуваннях сповіщень увімкни потрібні прийоми їжі й постав час, зручний саме тобі.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 9 FROM "faq_topics" t WHERE t."slug" = 'usage'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Як змінити ціль ваги?', 'Перейди на сторінку «Прогрес», натисни на віджет ваги, потім на кнопку «Ціль» і введи нове значення.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 1 FROM "faq_topics" t WHERE t."slug" = 'diet'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Скільки разів на день оптимально їсти?', 'За наявними дослідженнями найкраще працює схема «три основні прийоми плюс один перекус» - до п''яти разів на день. Це орієнтир, який підходить більшості.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 2 FROM "faq_topics" t WHERE t."slug" = 'diet'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Чи рахується маленький перекус?', 'Так, для організму це теж прийом їжі. Тому ми радимо збирати дрібні перекуси в один повноцінний - і рахувати простіше, і ситість тримається довше.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 3 FROM "faq_topics" t WHERE t."slug" = 'diet'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'О котрій краще снідати, обідати й вечеряти?', 'Обирай час, зручний саме тобі. Дослідження показують: індивідуальний графік працює краще, ніж спроба їсти «як усі».' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 4 FROM "faq_topics" t WHERE t."slug" = 'diet'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Навіщо їсти приблизно в один і той самий час?', 'Стабільний графік підтримує рівний рівень цукру в крові, гормональний баланс і нервову систему. На результат це впливає помітно.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 1 FROM "faq_topics" t WHERE t."slug" = 'results'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Чому вага стоїть на місці?', 'Найчастіше причина проста: норма трохи завелика або режим збився. Перевір, чи стабільно ти тримаєш норму хоча б два тижні - часто цього достатньо, щоб процес зрушив.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 2 FROM "faq_topics" t WHERE t."slug" = 'results'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Вага не змінюється вже кілька тижнів', 'Спробуй зменшувати денну норму на 100 ккал раз на тиждень. Якщо за два-три тижні нічого не змінилось — справа вже не в калоріях, і тут стане в пригоді лікар.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 3 FROM "faq_topics" t WHERE t."slug" = 'results'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Я їм дуже мало, а вага стоїть', 'Так буває: занизька калорійність гальмує результат. У такому разі норму піднімають на кілька тижнів — і процес часто зрушує. Крок непростий, тому пройти його краще разом зі спеціалістом.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 4 FROM "faq_topics" t WHERE t."slug" = 'results'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Не росте м''язова маса - що робити?', 'Калорійність можна поступово додавати, раз на тиждень. Але м''язи ростуть від тренувань із прогресією навантажень, тож результат складається з двох частин — застосунок закриває першу.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 5 FROM "faq_topics" t WHERE t."slug" = 'results'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Що робить застосунок, а що залежить від мене?', 'Ми рахуємо норму, підбираємо страви й допомагаємо тримати ритм харчування. Тренування, сон і регулярність — за тобою. Разом це працює найкраще.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 1 FROM "faq_topics" t WHERE t."slug" = 'health'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Чи можна користуватися під час вагітності або годування груддю?', 'Так, вести харчування можна. Період особливий, тому цільові цифри на цей час краще узгодити зі своїм лікарем - а застосунок допоможе їх дотримуватись.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 2 FROM "faq_topics" t WHERE t."slug" = 'health'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Чи підходить застосунок підліткам?', 'Для обліку харчування - цілком. Якщо йдеться про зміну ваги, норму варто узгодити з лікарем: організм ще росте, і цифри в цьому віці інші.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 3 FROM "faq_topics" t WHERE t."slug" = 'health'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'У мене є захворювання. Як користуватися?', 'Попроси у свого лікаря цільові цифри й внеси їх у застосунок вручну. Далі все працюватиме як звичайно - ми рахуємо й нагадуємо.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 4 FROM "faq_topics" t WHERE t."slug" = 'health'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Чим застосунок відрізняється від роботи з дієтологом?', 'Дієтолог враховує аналізи, історію та гормони. Застосунок бере на себе рутину: рахує, планує, нагадує. Найкраще вони працюють разом.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 1 FROM "faq_topics" t WHERE t."slug" = 'account'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Що буде після завершення підписки?', 'Платні функції призупиняться, безкоштовні залишаться доступними. Твої дані нікуди не зникають.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 2 FROM "faq_topics" t WHERE t."slug" = 'account'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Як скасувати підписку?', '1. Керування підпискою - у налаштуваннях твого App Store або Google Play.
2. В профілі відкрити вкладку “Підписка” ви можете скасувати підписку.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 3 FROM "faq_topics" t WHERE t."slug" = 'account'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Як видалити акаунт і дані?', 'У налаштуваннях профілю. Дані зберігаються ще 30 днів - за цей час акаунт можна відновити. Після цього вони видаляються остаточно.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 4 FROM "faq_topics" t WHERE t."slug" = 'account'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Що відбувається з моїми даними?', 'Вони зберігаються тільки для роботи застосунку. Ми не продаємо й не передаємо персональні дані третім особам.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 5 FROM "faq_topics" t WHERE t."slug" = 'account'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Чи є реферальна програма?', 'Так, вона у твоєму профілі. Там описано, які бонуси отримуєш ти й людина, яку ти запросив.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 1 FROM "faq_topics" t WHERE t."slug" = 'technical'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Чи є версія для Android?', 'Так, застосунок працює і на iOS, і на Android.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 2 FROM "faq_topics" t WHERE t."slug" = 'technical'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Чи працює застосунок без інтернету?', 'Так, основні функції доступні в офлайн-режимі.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 3 FROM "faq_topics" t WHERE t."slug" = 'technical'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Чи синхронізується застосунок з Apple Health?', 'Поки що ні. Кроки та воду можна вносити вручну - це займає кілька секунд.' FROM q;--> statement-breakpoint
WITH q AS (
	INSERT INTO "faq_questions" ("topic_id", "sort_order")
	SELECT t."id", 4 FROM "faq_topics" t WHERE t."slug" = 'technical'
	RETURNING "id"
)
INSERT INTO "faq_question_translations" ("question_id", "language", "question", "answer")
SELECT q."id", 'uk', 'Як зв''язатися з підтримкою?', 'Напиши нам із розділу підтримки в налаштуваннях профілю. Зазвичай відповідаємо протягом 24 годин. Або перейдіть за посиланням.' FROM q;
