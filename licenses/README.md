# Dependency notices

The build reads production dependency licenses from installed npm packages and includes them in `dist/THIRD_PARTY_NOTICES.txt`, alongside Frameway's LICENSE and NOTICE. Missing notices fail the build.

`react-remove-scroll-bar@2.3.8` omits its license file from its npm archive. The checked-in fallback is the [upstream MIT license](https://github.com/theKashey/react-remove-scroll-bar/blob/master/LICENSE), retrieved November 16, 2026. The fallback is version-specific so a dependency update requires reviewing its notice again. All other current production packages provide their license files; licenses are MIT except tslib's 0BSD.
