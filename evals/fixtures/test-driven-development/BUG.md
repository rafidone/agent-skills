# Bug report: splitCents loses a cent

Finance reconciled a payout and found a missing cent.

Reproduction:

```js
splitCents(100, 3); // returns [33, 33, 33], sum is 99
```

Expected: `[34, 33, 33]`. The remainder must be distributed one cent at a time
to the earliest shares. For example, `splitCents(100, 7)` must return
`[15, 15, 14, 14, 14, 14, 14]`.

The function must always preserve the total and never return a negative share.
