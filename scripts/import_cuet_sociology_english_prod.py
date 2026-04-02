import json
import os
import re
import uuid
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

INPUT_DIR = Path(r"C:\Users\VRISHANK\Downloads\Sociology Eng Medium10 QPs-20260331T165150Z-3-001\Sociology Eng Medium10 QPs")
OUTPUT_JSON = Path(r"C:\Users\VRISHANK\OneDrive\Desktop\ML\merit_launchers\tmp\cuet_sociology_english_import.json")
COURSE_ID = 'cuet'
SUBJECT_ID = 'cuet-sociology'
DURATION_MINUTES = 60
MARKS = 5
NEGATIVE_MARKS = 1

NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
CHATGPT_NOISE_PREFIXES = (
    'Would you like me',
    'Let me know when',
    'You said:',
    'ChatGPT said:',
    'Continuing with:',
    'Ask ChatGPT',
    'proceed',
    'continue',
)


def clean_text(text: str) -> str:
    text = text.replace('&amp;', '&')
    text = text.replace('\u2013', '-')
    text = text.replace('\u2014', '-')
    text = text.replace('\u2018', "'")
    text = text.replace('\u2019', "'")
    text = text.replace('\u201c', '"')
    text = text.replace('\u201d', '"')
    text = text.replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def clean_multiline_text(text: str) -> str:
    text = text.replace('&amp;', '&')
    text = text.replace('\u2013', '-')
    text = text.replace('\u2014', '-')
    text = text.replace('\u2018', "'")
    text = text.replace('\u2019', "'")
    text = text.replace('\u201c', '"')
    text = text.replace('\u201d', '"')
    text = text.replace('\xa0', ' ')
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r' *\n *', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def format_structured_prompt(text: str) -> str:
    text = clean_multiline_text(text)
    if not text:
        return ''
    text = re.sub(r'(Match List I with List II)', r'\1\n', text, count=1)
    text = re.sub(r'(List I\s*\([^)]+\))', r'\n\1', text)
    text = re.sub(r'(List II\s*\([^)]+\))', r'\n\1', text)
    text = re.sub(r'(?<!\n)(?<!^)([A-D]\.\s)', r'\n\1', text)
    text = re.sub(r'(?<!\n)(?<!^)((?:IV|III|II|I)\.\s)', r'\n\1', text)
    text = re.sub(r'([a-z0-9\)])([A-D]\.\s)', r'\1\n\2', text)
    text = re.sub(r'([a-z0-9\)])((?:IV|III|II|I)\.\s)', r'\1\n\2', text)
    text = re.sub(r'(Passage\s+\d+\s*:\s*)', r'\n\1', text)
    text = re.sub(r'(?<=\s)(\d+\.\s)', r'\n\1', text, count=1)
    text = re.sub(r'^Section [A-Z]:.*?\n', '', text, flags=re.I)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def should_skip_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return True
    return any(stripped.startswith(prefix) for prefix in CHATGPT_NOISE_PREFIXES)


def extract_paragraphs(path: Path):
    with zipfile.ZipFile(path) as zf:
        root = ET.fromstring(zf.read('word/document.xml'))
    paragraphs = []
    for p in root.findall('.//w:p', NS):
        texts = [t.text or '' for t in p.findall('.//w:t', NS)]
        line = clean_text(''.join(texts))
        if should_skip_line(line):
            continue
        paragraphs.append(line)
    return paragraphs


def extract_passages(paragraphs):
    passages = []
    i = 0
    while i < len(paragraphs):
        line = paragraphs[i]
        if re.match(r'^Passage\s+\d+\s*:', line, flags=re.I):
            chunk = [line]
            j = i + 1
            while j < len(paragraphs):
                nxt = paragraphs[j]
                if re.match(r'^(Passage\s+\d+\s*:|Section\s+[A-Z]\s*:)', nxt, flags=re.I):
                    break
                if 'Answer:' in nxt:
                    break
                chunk.append(nxt)
                j += 1
            passages.append(clean_multiline_text('\n'.join(chunk)))
            i = j
            continue
        i += 1
    return passages


def build_question_blocks(paragraphs):
    blocks = []
    current = []
    for line in paragraphs:
        current.append(line)
        if 'Answer:' in line:
            blocks.append(current[:])
            current = []
    return blocks


def parse_inline_question(line: str):
    match = re.search(r'Answer\s*:\s*\(([a-dA-D])\)', line)
    if not match:
        return None
    body = clean_text(line[:match.start()])
    option_match = re.match(
        r'^(.*?)(?=\(a\))\(a\)\s*(.*?)(?=\(b\))\(b\)\s*(.*?)(?=\(c\))\(c\)\s*(.*?)(?=\(d\))\(d\)\s*(.*)$',
        body,
        flags=re.S,
    )
    if not option_match:
        return None
    return {
        'answer_letter': match.group(1).lower(),
        'prompt': clean_text(option_match.group(1)),
        'options': [clean_text(option_match.group(i)) for i in range(2, 6)],
    }


def parse_block(block_lines, question_number: int, passage_contexts):
    if not block_lines:
        raise ValueError(f'Empty question block for question {question_number}')

    last_line = block_lines[-1]
    parsed_inline = parse_inline_question(last_line)
    if parsed_inline and last_line.lstrip().startswith('(a)'):
        parsed_inline = None
    if parsed_inline:
        prompt = parsed_inline['prompt']
        options = parsed_inline['options']
        answer_letter = parsed_inline['answer_letter']
    else:
        last_line = block_lines[-1]
        match = re.search(r'Answer\s*:\s*\(([a-dA-D])\)', last_line)
        if not match:
            raise ValueError(f'No answer marker found for question {question_number}: {" ".join(block_lines)[:180]}')
        answer_letter = match.group(1).lower()
        option_line = clean_text(last_line[:match.start()])
        option_match = re.match(
            r'^\(a\)\s*(.*?)(?=\(b\))\(b\)\s*(.*?)(?=\(c\))\(c\)\s*(.*?)(?=\(d\))\(d\)\s*(.*)$',
            option_line,
            flags=re.S,
        )
        if not option_match:
            raise ValueError(f'Could not parse structured options for question {question_number}: {option_line[:250]}')
        options = [clean_text(option_match.group(i)) for i in range(1, 5)]
        prompt = clean_multiline_text('\n'.join(block_lines[:-1]))

    prompt = re.sub(r'^\d+\.\s*', '', prompt)

    if 31 <= question_number <= 50:
        passage_index = (question_number - 31) // 5
        if 0 <= passage_index < len(passage_contexts):
            passage_text = passage_contexts[passage_index]
            if passage_text and passage_text not in prompt:
                prompt = clean_multiline_text(f'{passage_text}\n{prompt}')

    prompt = format_structured_prompt(prompt)
    if any(not opt for opt in options):
        raise ValueError(f'Blank option found for question {question_number}')

    correct_index = ord(answer_letter) - ord('a')
    if not 0 <= correct_index < len(options):
        raise ValueError(f'Correct index out of range for question {question_number}')

    return {
        'id': str(uuid.uuid4()),
        'section': f'Question {question_number}',
        'prompt': prompt,
        'promptSegments': [],
        'options': options,
        'optionSegments': [[], [], [], []],
        'correctIndex': correct_index,
        'explanation': None,
        'topic': 'Sociology',
        'concepts': [],
        'difficulty': 'medium',
        'marks': MARKS,
        'negativeMarks': NEGATIVE_MARKS,
    }


def parse_paper(path: Path, ordinal: int):
    paragraphs = extract_paragraphs(path)
    passages = extract_passages(paragraphs)
    blocks = build_question_blocks(paragraphs)
    if len(blocks) != 75:
        raise ValueError(f'{path.name}: expected 75 question blocks, found {len(blocks)}')
    questions = [parse_block(block, index + 1, passages) for index, block in enumerate(blocks)]
    title = f'SOCIOLOGY MOCK {ordinal}'
    paper = {
        'id': str(uuid.uuid4()),
        'courseId': COURSE_ID,
        'subjectId': SUBJECT_ID,
        'title': title,
        'durationMinutes': DURATION_MINUTES,
        'instructions': [
            'Each question carries 5 marks.',
            'Each incorrect answer carries a negative marking of 1 mark.',
            'Duration: 60 minutes.',
        ],
        'isFreePreview': ordinal == 1,
    }
    return {'paper': paper, 'questions': questions, 'sourceFile': path.name}


def main():
    files = sorted(INPUT_DIR.glob('*.docx'), key=lambda p: int(re.search(r'(\d+)', p.stem).group(1)))
    payload = [parse_paper(path, idx + 1) for idx, path in enumerate(files)]
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    print(f'Wrote {len(payload)} papers to {OUTPUT_JSON}')
    for item in payload:
        print(item['paper']['title'], len(item['questions']), item['sourceFile'], 'preview=' + str(item['paper']['isFreePreview']))


if __name__ == '__main__':
    main()
