The IBAN validator recalculates the check digits of an IBAN and breaks Swiss and
Liechtenstein IBANs down into their components. The check runs entirely in your browser; the
number you enter does not leave your device.

### What the modulo 97-10 method does

Every IBAN carries two check digits in positions 3 and 4. They are calculated with the
modulo 97-10 method according to ISO/IEC 7064: the country code and check digits move to the
end, letters are converted to numbers, and the remainder of the division by 97 must be 1. The
method reliably detects a single wrong position and also the most common typing error of
all, two adjacent digits swapped.

What it does not do: it does not tell you **which** position is wrong. Arithmetically, the
only certain statement is that the check digits and the rest of the number do not match —
the error may just as well be in the account number. That is why the error message states
the check digits that would match the account number you entered, and leaves the conclusion
to you. Nor does it catch every alteration: roughly one in 97 random digit sequences passes
the check by arithmetic alone.

### What sets a QR-IBAN apart

Formally, an IBAN and a QR-IBAN do not differ; both follow the ISO 13616 standard. The
difference lies in positions 5 to 9, the institution identification (IID). If it falls in
the range 30000 to 31999, it is a QR-IID and therefore a QR-IBAN. These numbers are reserved
for the procedure with a QR reference: a QR-IBAN requires a QR reference, a conventional
IBAN excludes it. Mixing the two up produces invoices that banks reject. A QR-IBAN can also
only be used for incoming payments.

### Why the account may still not exist

The check digits are pure arithmetic. They prove that the sequence of digits is consistent
in itself — not that the bank exists, the account is open, the name matches the number, or a
payment will arrive. Only the account-holding bank knows that. A formally correct IBAN can
point to an account that was closed long ago.

For countries outside Switzerland and Liechtenstein we also calculate the check digits,
because the method does not depend on the country. We do not check length and structure
there, because we have no verified registry for them. The result says so explicitly instead
of claiming a certainty that does not exist.

As of: 18 October 2026 · Sources: SIX Group, Swiss Implementation Guidelines for the
QR-bill, version 2.3, chapters 2.8 and 2.10; SIX Group, Technical information about the
QR-IID and QR-IBAN, version 1.1; SIX Group, IBAN Checker for Switzerland.
