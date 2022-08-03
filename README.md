# tsgammon-ui

Typescript + React (Create React App)
で実装された[バックギャモン](https://ja.wikipedia.org/wiki/%E3%83%90%E3%83%83%E3%82%AF%E3%82%AE%E3%83%A3%E3%83%A2%E3%83%B3) です。

思考エンジンには[jgammon](https://github.com/tkshio/jgammon) により訓練したニューラルネットワークを使用しています（あまり強くありません）。

## デモ

https://tkshio.github.io/tsgammon-ui/

## ビルド・実行

````
> npm run build
> npm install -g serve
> serve build
````

## 対局について

* ルール、スコア、PositionIDによる盤面の指定、手番、ロールなどが設定可能です。
* Unlimited Matchの場合、Jacobyルールが適用されます（未ダブルの場合ギャモン・バックギャモン無効）。
* CPUはバックギャモンを意識していません。
* CPUのキューブアクションはマッチポイントに対応していないので、かなりひどい判断をします。
* 本雙六ルール(HonSugoroku)では、ゾロ目でも二つの駒しか動かせません。また、全ての駒をインナーボードに集めると勝利ですが、リターンヒットの可能性がある時は続行です。プライムは作成可能です。
* <span style="border-radius: 5px; display: flex; align-items: center; padding: 2px 5px; background-color: rgb(47, 79, 79); color: rgb(255, 255, 255); font-size:9pt; width: fit-content; margin-right: 5px; justify-content: center;">
  Copy Records</span>により、棋譜をクリップボードにコピーできます。コピーした棋譜は、XGで解析することができます。

## ライセンス

本ソースコードのライセンスはApache License, Version 2.0とします。

## 更新履歴

### 2022/08/03

- 各種設定画面を追加
- 降参する機能を追加
- MatchID/PositionIDを追加
