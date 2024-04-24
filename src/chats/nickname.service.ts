import { Injectable } from '@nestjs/common';
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from 'unique-names-generator';

@Injectable()
export class NicknameGeneratorService {
  private koreanAdjectives = [
    '용감한',
    '빠른',
    '느린',
    '기쁜',
    '슬픈',
    '예쁜',
    '화난',
    '귀여운',
    '배고픈',
    '철학적인',
    '현학적인',
    '슬픈',
    '푸른',
    '비싼',
    '밝은',
  ];
  private koreanAnimals = [
    '호랑이',
    '곰',
    '토끼',
    '여우',
    '사슴',
    '호랑이',
    '비버',
    '강아지',
    '부엉이',
    '여우',
    '치타',
    '문어',
    '고양이',
    '미어캣',
    '다람쥐',
  ];

  generateNickname(): string {
    return uniqueNamesGenerator({
      dictionaries: [this.koreanAdjectives, this.koreanAnimals],
      length: 2,
      separator: ' ',
      style: 'capital',
    });
  }
}
