-- Targeted live-repair script for CUET Mathematics PAPER 5, PAPER 7, and PAPER 10.
-- These updates are source-backed and intentionally surgical:
-- - PAPER 5: remove duplicate tail rows introduced by prior repair attempts
-- - PAPER 7: fix late-block answer key / prompt correctness where the OCR source is clear
-- - PAPER 10: clean heavily corrupted late-block prompts and restore the final derivative row

begin;

-- PAPER 5 ---------------------------------------------------------------
-- Drop stale duplicate rows so the paper returns to a 50-row shape.
delete from questions
where id in (
  'cuet-mathematics-mathematics-paper-5-pdf-0a2bc68a-q043',
  'cuet-mathematics-mathematics-paper-5-pdf-0a2bc68a-q044',
  'cuet-mathematics-mathematics-paper-5-pdf-0a2bc68a-q045'
);

-- PAPER 7 ---------------------------------------------------------------
update questions
set correct_index = 3
where id = 'cuet-mathematics-mathematics-paper-7-pdf-5056cd35-q43';

update questions
set prompt = 'If a, b, c are three non-coplanar mutually perpendicular unit vectors, then [a b c] is',
    options = '["1", "0", "-2", "2"]'::jsonb,
    correct_index = 0
where id = 'cuet-mathematics-mathematics-paper-7-pdf-5056cd35-q46';

update questions
set prompt = 'The differential coefficient of f(log x) with respect to x, where f(x) = x, is',
    options = '["1/x", "x", "1/(x log x)", "None of these"]'::jsonb,
    correct_index = 2
where id = 'cuet-mathematics-mathematics-paper-7-pdf-5056cd35-q48';

update questions
set correct_index = 1
where id = 'cuet-mathematics-mathematics-paper-7-pdf-5056cd35-manual-q042';

update questions
set prompt = 'Given f(x) = 4x^8, then',
    options = '["f''''(1/2) = f''''(-1/2)", "f''''(1/2) = -f''''(-1/2)", "f(1/2) = f(-1/2)", "f(1/2) = f''''(-1/2)"]'::jsonb,
    correct_index = 2
where id = 'cuet-mathematics-mathematics-paper-7-pdf-5056cd35-q47';

-- PAPER 10 --------------------------------------------------------------
update questions
set prompt = 'The integral ∫_0^(π/2) sin^2 x dx is'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q15';

update questions
set prompt = 'The integral ∫_0^(π/2) log(tan x) dx is'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q16';

update questions
set prompt = 'The integral ∫_0^4 dx / √(16 - x^2) is'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q17';

update questions
set prompt = 'The integral ∫_2^4 x/(x^2 + 1) dx is'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q19';

update questions
set prompt = 'The integral ∫_e^(e^2) (1/(x log x)) dx is'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q20';

update questions
set prompt = 'If ax^2 + 2hxy + by^2 = 1, then dy/dx equals'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q21';

update questions
set prompt = 'The maximum value of Z = 3x + 4y subjected to constraints x + y <= 4, x >= 0 and y >= 0 is'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q23';

update questions
set prompt = 'Region represented by x >= 0, y >= 0 is:'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q24';

update questions
set prompt = 'Write the principal value of tan^-1(√3) + cot^-1(√3).',
    options = '["π/2", "π/6", "π/4", "π/8"]'::jsonb,
    correct_index = 0
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q26';

update questions
set prompt = 'Find the value of tan^-1[tan(9π/8)].',
    options = '["π/2", "π/6", "π/4", "π/8"]'::jsonb,
    correct_index = 3
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q27';

update questions
set prompt = 'The set of values of csc^-1(√3/2) is',
    options = '["0", "π", "1", "Not defined"]'::jsonb,
    correct_index = 3
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q28';

update questions
set prompt = 'If y = sec^-1((x+1)/(x-1)) + sin^-1((x-1)/(x+1)), then dy/dx'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q33';

update questions
set prompt = 'If f(x)= tan^-1((1+sin x)/(1-sin x)), 0 <= x <= π/2, then f''(π/6) is'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q35';

update questions
set prompt = 'If y = log(tan x), write dy/dx'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q36';

update questions
set prompt = 'If y = sin^-1(2x/(1+x^2)), write the value of dy/dx for x > 1.'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q37';

update questions
set prompt = 'For real numbers x and y, define xRy if x - y + √2 is an irrational number. Then the relation R is',
    options = '["Reflexive", "Symmetric", "Transitive", "None of these"]'::jsonb,
    correct_index = 0
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q39';

update questions
set prompt = 'The vector equation for the line passing through the points (-1,0,2) and (3,4,6) is'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q42';

update questions
set prompt = 'If the lines (x-2)/1 = (y-2)/1 = (z-4)/k and (x-1)/k = (y-4)/2 = (z-5)/1 are coplanar, then k can have:'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q43';

update questions
set prompt = 'If x = e^t sin t, y = e^t cos t, where t is a parameter, then dy/dx at (1,1) is'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q44';

update questions
set prompt = 'A fair coin is tossed 99 times. If X is the number of times heads occur, then P(X = r) is maximum when r is'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q45';

update questions
set prompt = 'If x = a sin θ and y = b cos θ, then d^2y/dx^2 is equal to'
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q46';

update questions
set prompt = 'The plane 2x - (1 + λ)y + 3λz = 0 passes through the intersection of the planes',
    options = '["2x - y = 0 and y - 3z = 0", "2x + 3z = 0 and y = 0", "2x - y + 3z = 0 and y - 3z = 0", "None of these"]'::jsonb,
    correct_index = 0
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q47';

update questions
set prompt = 'If x=t^2, y=t^3, then d^2y/dx^2 =',
    options = '["3/2", "3/(4t)", "3/(2t)", "3t/2"]'::jsonb,
    correct_index = 1
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q48';

update questions
set prompt = 'The value of c in Rolle''s theorem for the function f(x) = sin 2x in [0, π/2] is',
    options = '["π/4", "π/6", "π/2", "π/3"]'::jsonb,
    correct_index = 0
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q49';

update questions
set prompt = 'If y = ax^2 + b, then dy/dx at x = 2 is equal to',
    options = '["2a", "3a", "4a", "None of these"]'::jsonb,
    correct_index = 2
where id = 'cuet-mathematics-mathematics-paper-10-pdf-77da3185-q50';

commit;
