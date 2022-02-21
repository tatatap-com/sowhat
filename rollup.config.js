import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { terser } from "rollup-plugin-terser";

export default {
  input: 'src/index.js',
  output: [
    {
      file: './dist/sowhat.js',
      format: 'cjs'
    },
    { file: "./dist/sowhat.min.js", format: "cjs", plugins: [terser(
      {
        format: {
          comments: function (node, comment) {
            const text = comment.value;
            const type = comment.type;
            if (type == "comment2") {
              // multiline comment
              return /@preserve|@license|@cc_on/i.test(text);
            }
          }
        }
      }
    )] },
  ],

  plugins: [commonjs(), nodeResolve()]
}
