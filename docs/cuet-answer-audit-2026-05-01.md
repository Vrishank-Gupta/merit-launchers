# CUET Answer Audit Findings

Audit date: 2026-05-01

Scope reviewed:
- Live CUET question bank exported from production
- Mathematics subject excluded
- Duplicate copies collapsed for review

Current production snapshot:
- Non-maths CUET question rows in prod: 15,504
- Unique non-maths questions after de-duplication: 8,655
- Duplicate-copy conflicts in marked correct option: 53 unique questions
- Clearly malformed live questions detected during export: at least 45

Important note:
- This report lists high-confidence wrong answer markings and malformed items validated from the live export.
- Several Hindi-medium/OCR-damaged questions are unreadable enough that they need source cleanup before answer auditing.

## High-Confidence Wrong Answer Markings

### Accountancy

1. `cf-001`
Prompt: `Which of the following is not a form of presenting financial analysis :`
Correct option: `3. Annual Report`
Observed wrong marking in prod: one copy marks `0`, while two copies mark `3`.

2. `uq-00095`
Prompt: `Assertion(A): Financial Statements of a company are prepared in the form prescribed in Schedule II of the Companies Act, 2013. Reason(R): Section 129 of the companies Act, 2013 prescribes Schedule III as per which financial statements have to prepared by all companies.`
Correct option: `3. Assertion is false and Reason is true.`
Why: financial statements are prepared under `Schedule III`, not `Schedule II`.

3. `uq-00248`
Prompt: `Sacrificing ratio is the difference between:`
Correct option: `1. Old ratio and new ratio`

4. `uq-00254`
Prompt: `On dissolution, Goodwill Account is transferred to:`
Correct option: `1. Realisation Account`

5. `uq-00272`
Prompt: `In case of death of a partner, the whole amount standing to the credit of his Capital Account is ...`
Correct option: `1. His executor's account`

6. `uq-00286`
Prompt: `Assertion(A) : Rent payable to a partner is transferred to the credit of Partner's Capital Account and not to Rent Payable Account. Reason(R) : Rent payable to a partner for letting the firm use his personal property for business is a transaction that is not related to him being a partner. Therefore, it is credited to Rent Payable Account.`
Correct option: `2. Assertion is true but Reason is false.`

### Biology

1. `cf-003`
Prompt: `Non-albuminous seeds have no residual endosperm. Reason: The endosperm is completely consumed during embryo development.`
Correct option: `0. Both A and R are true and R is the correct explanation of A`
Observed wrong marking in prod: two copies mark `2`; one copy leaves answer unresolved.

### Business Studies

1. `cf-004`
Prompt: `Which business environment did Coca-Cola Company managed to get in their favour.`
Correct option: `2. Political environment`

2. `cf-005`
Prompt: `A decision for replacing machines with modern machinery of higher production capacity is a`
Correct option: `2. Investment decision`

3. `cf-006`
Prompt: `Which of the following is/are depository participants?`
Correct option: `3. All of these`

4. `cf-007`
Prompt: `...subordinates receive orders from several specialists... This style of working is followed in which organisation?`
Correct option: `1. Functional organisation`

5. `cf-008`
Prompt: `Which of the following is not a type of psychological barriers?`
Correct option: `2. Fear of challenge to authority`

### Economics

1. `cf-009`
Prompt: `Demand Deposits include ...`
Correct option: `2. (I) and (III)`
Why: demand deposits include savings account deposits and current account deposits.

2. `cf-010`
Prompt: `_____ is a situation when 'managed floating' is exercised by the Central Bank.`
Correct option: `2. Dirty floating`
Observed wrong marking in prod: copies currently mark only `0` or `3`.

### English

1. `cf-012`
Prompt: `A government run by a dictator`
Correct option: `1. Autocracy`

### Physics

1. `cf-019`
Prompt: `If alpha, beta and gamma rays carry same momentum, which has the longest wavelength?`
Correct option: `3. None, all have same wavelength`
Why: by de Broglie relation, equal momentum implies equal wavelength.

### Political Science

1. `cf-020`
Prompt: `Why did Muslim League propound two-nation theory?...`
Correct option: `0. i only`

2. `cf-021`
Prompt: `Which was the first state formed on the basis of language in independent India?`
Correct option: `1. Andhra Pradesh`

3. `cf-022`
Prompt: `The formation of Linguistic States was approved by:`
Correct option: `0. The principle of diversity`

4. `cf-023`
Prompt: `Which one of the following was NOT given primacy by the makers of the Soviet System?`
Correct option: `3. No state control over the economy`

5. `cf-024`
Prompt: `Which one of the following was a part of its global war on terrorism by the US.?`
Correct option: `2. Operation enduring freedom`

6. `cf-025`
Prompt: `Which among the following statements about hegemony is incorrect?`
Correct option: `3. Hegemonic position is fixed. Once a hegemon, always a hegemon.`

7. `cf-026`
Prompt: `Which among the following statements that describe the nature of the Soviet economy is wrong?`
Correct option: `2. People enjoyed economic freedom`

8. `cf-027`
Prompt: `Which one of the following statements about the ethnic conflict in Sri Lanka is false?`
Correct option: `2. Liberation Tigers of Tamil Elam were supported by the SAARC countries.`

9. `cf-029`
Prompt: `Which country in Central Asia witnessed a civil war that went on for ten years?`
Correct option: `1. Tajikistan`

10. `cf-030`
Prompt: `The Chechens are`
Correct option: `3. Muslim ethnic group`

11. `cf-031`
Prompt: `The event that took place in 1961 was`
Correct option: `0. The construction of the Berlin wall`

12. `cf-032`
Prompt: `After the Second World War, the world was divided into the blocks of`
Correct option: `3. U.S.A and USSR`

13. `cf-033`
Prompt: `The World Trade Center and Pentagon buildings of the USA were attacked by:`
Correct option: `1. Al-Qaeda.`

14. `cf-034`
Prompt: `The Berlin wall fall in`
Correct option: `0. November 1989`

15. `cf-035`
Prompt: `The more weightage to India's proposal for permanent membership in the Security Council is`
Correct option: `3. India's growing economic power and stable political system`

16. `cf-036`
Prompt: `Which statement is not the result of the disintegration of Soviet Union?`
Correct option: `3. Crises in the Middle-East.`

17. `cf-037`
Prompt: `Which among the following is the result of planning?`
Correct option: `3. All of the above`

18. `cf-038`
Prompt: `Tryst with Destiny named address is related to whom?`
Correct option: `2. Jawahar Lal Nehru`

19. `cf-040`
Prompt: `By what name did the US attack Iraq on March 19, 2003?`
Correct option: `1. Operation Iraqi Freedom`

20. `cf-041`
Prompt: `By whom was the speech of 'Tryst with Destiny' delivered?`
Correct option: `1. Jawahar Lal Nehru`

21. `cf-042`
Prompt: `When was the National Development Council established?`
Correct option: `2. 6th August, 1952`

22. `cf-044`
Prompt: `What is wrong about the National Development Council?`
Correct option: `0. The National Development Council has a Deputy Chairman.`

23. `cf-045`
Prompt: `What is the meaning of non-alignment?`
Correct option: `0. Keeping distance from any country or groups formed by other countries`

24. `cf-046`
Prompt: `Assertion: The linguistic reorganization provided a uniform basis for the demarcation of the states. Reason: This also gave acceptance to the principle of variation.`
Correct option: `2. Assertion is correct statement but reason is wrong statement.`

25. `cf-047`
Prompt: `Sardar Vallabhbhai Patel was entrusted with the task of unification of the princely states. Which of the following arguments is not correct?`
Correct option: `2. Muslim League wanted that the task of integration should be entrusted to Sardar Vallabhbhai Patel.`

26. `cf-048`
Prompt: `Aim of India's planning system is:`
Correct option: `3. All of the above`

27. `cf-049`
Prompt: `Who was the foreign minister of India from 1946-64?`
Correct option: `1. Jawahar Lal Nehru`

28. `cf-050`
Prompt: `The United Nations was founded on`
Correct option: `0. 24th October 1945.`

29. `cf-051`
Prompt: `Which one of the following statements about the ethnic conflict in Sri Lanka is false?`
Correct option: `2. Liberation Tigers of Tamil Elam were supported by the SAARC countries.`

30. `cf-052`
Prompt: `Why did Muslim League oppose the Indian National Congress?`
Correct option: `2. For merging the Princely States into the Indian Union.`

### Psychology

1. `cf-053`
Prompt: `The Stanford Prison Experiment demonstrates the impact of:`
Correct option: `1. Role expectations on behavior`

## Malformed Or Unusable Live Items

1. `uq-00001`
Subject: `Accountancy`
Prompt: `Functional structure`
Issue: all four options are identical to the prompt. This live question is malformed and should be removed or replaced.

2. Hindi-medium conflict set:
`cf-011`, `cf-013`, `cf-014`, `cf-015`, `cf-016`, `cf-017`, `cf-018`
Issue: OCR/text corruption is too severe for safe answer auditing from the live export alone.

## Still Needs Another Pass

These conflict items need source validation before changing answers because the prompt/options themselves look ambiguous, incomplete, or historically inconsistent enough that I would not recommend changing prod on confidence alone:

- `cf-028` Political Science: Axis Nation set
- `cf-039` Political Science: population of India before division
- `cf-043` Political Science: NATO set question

## Files Produced During Audit

- Raw production export: [cuet_non_math_questions_prod.json](/c:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/docs/cuet_non_math_questions_prod.json)
- Conflict extraction: [cuet_conflicting_answer_marks.json](/c:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/docs/cuet_conflicting_answer_marks.json)
- Partial model review cache: [cuet_answer_audit_gemini.json](/c:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/docs/cuet_answer_audit_gemini.json)
