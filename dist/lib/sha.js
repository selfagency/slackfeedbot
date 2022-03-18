var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const isObject = (val) => {
    return val != null && typeof val === 'object' && !Array.isArray(val);
};
const objectToArraySortedByKey = (obj) => {
    if (!isObject(obj) && !Array.isArray(obj)) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => {
            if (Array.isArray(item) || isObject(item)) {
                return objectToArraySortedByKey(item);
            }
            return item;
        });
    }
    return Object.keys(obj)
        .sort()
        .map((key) => {
        return [key, objectToArraySortedByKey(obj[key])];
    });
};
const hashable = (obj) => {
    return JSON.stringify(objectToArraySortedByKey(obj));
};
const digest = (obj, algorithm = 'SHA-256') => {
    const algorithms = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
    if (!algorithms.includes(algorithm)) {
        throw RangeError(`Valid hash algorithm values are any of ${JSON.stringify(algorithms)}`);
    }
    return ((obj, algorithm) => __awaiter(void 0, void 0, void 0, function* () {
        const encoder = new TextEncoder();
        const hashInput = encoder.encode(hashable(obj)).buffer;
        let digest = '';
        {
            const nodeAlg = algorithm.toLowerCase().replace('-', '');
            digest = require('crypto').createHash(nodeAlg).update(Buffer.from(hashInput)).digest('hex'); // eslint-disable-line
        }
        /* eslint-enable no-lone-blocks */
        return digest;
    }))(obj, algorithm);
};
export default digest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9zaGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBRUEsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFZLEVBQUUsRUFBRTtJQUNoQyxPQUFPLEdBQUcsSUFBSSxJQUFJLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN2RSxDQUFDLENBQUM7QUFFRixNQUFNLHdCQUF3QixHQUFHLENBQUMsR0FBWSxFQUFXLEVBQUU7SUFDekQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDekMsT0FBTyxHQUFHLENBQUM7S0FDWjtJQUVELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUN0QixPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDcEIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDekMsT0FBTyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN2QztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7S0FDSjtJQUVELE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBYyxHQUFHLENBQUM7U0FDakMsSUFBSSxFQUFFO1NBQ04sR0FBRyxDQUFDLENBQUMsR0FBVyxFQUFFLEVBQUU7UUFDbkIsT0FBTyxDQUFDLEdBQUcsRUFBRSx3QkFBd0IsQ0FBZSxHQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xFLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDO0FBRUYsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFnQixFQUFVLEVBQUU7SUFDNUMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDdkQsQ0FBQyxDQUFDO0FBRUYsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFnQixFQUFFLFNBQVMsR0FBRyxTQUFTLEVBQUUsRUFBRTtJQUN6RCxNQUFNLFVBQVUsR0FBRyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzlELElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQ25DLE1BQU0sVUFBVSxDQUFDLDBDQUEwQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUMxRjtJQUNELE9BQU8sQ0FBQyxDQUFPLEdBQUcsRUFBRSxTQUFTLEVBQUUsRUFBRTtRQUMvQixNQUFNLE9BQU8sR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO1FBQ2xDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3ZELElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQjtZQUNFLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsc0JBQXNCO1NBQ3BIO1FBQ0Qsa0NBQWtDO1FBQ2xDLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUMsQ0FBQSxDQUFDLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3JCLENBQUMsQ0FBQztBQUVGLGVBQWUsTUFBTSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2FjaGVSZWNvcmQgfSBmcm9tICcuL2NhY2hlJztcblxuY29uc3QgaXNPYmplY3QgPSAodmFsOiB1bmtub3duKSA9PiB7XG4gIHJldHVybiB2YWwgIT0gbnVsbCAmJiB0eXBlb2YgdmFsID09PSAnb2JqZWN0JyAmJiAhQXJyYXkuaXNBcnJheSh2YWwpO1xufTtcblxuY29uc3Qgb2JqZWN0VG9BcnJheVNvcnRlZEJ5S2V5ID0gKG9iajogdW5rbm93bik6IHVua25vd24gPT4ge1xuICBpZiAoIWlzT2JqZWN0KG9iaikgJiYgIUFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgcmV0dXJuIG9iai5tYXAoaXRlbSA9PiB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSB8fCBpc09iamVjdChpdGVtKSkge1xuICAgICAgICByZXR1cm4gb2JqZWN0VG9BcnJheVNvcnRlZEJ5S2V5KGl0ZW0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gT2JqZWN0LmtleXMoPENhY2hlUmVjb3JkPm9iailcbiAgICAuc29ydCgpXG4gICAgLm1hcCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgIHJldHVybiBba2V5LCBvYmplY3RUb0FycmF5U29ydGVkQnlLZXkoKDxDYWNoZVJlY29yZD5vYmopW2tleV0pXTtcbiAgICB9KTtcbn07XG5cbmNvbnN0IGhhc2hhYmxlID0gKG9iajogQ2FjaGVSZWNvcmQpOiBzdHJpbmcgPT4ge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob2JqZWN0VG9BcnJheVNvcnRlZEJ5S2V5KG9iaikpO1xufTtcblxuY29uc3QgZGlnZXN0ID0gKG9iajogQ2FjaGVSZWNvcmQsIGFsZ29yaXRobSA9ICdTSEEtMjU2JykgPT4ge1xuICBjb25zdCBhbGdvcml0aG1zID0gWydTSEEtMScsICdTSEEtMjU2JywgJ1NIQS0zODQnLCAnU0hBLTUxMiddO1xuICBpZiAoIWFsZ29yaXRobXMuaW5jbHVkZXMoYWxnb3JpdGhtKSkge1xuICAgIHRocm93IFJhbmdlRXJyb3IoYFZhbGlkIGhhc2ggYWxnb3JpdGhtIHZhbHVlcyBhcmUgYW55IG9mICR7SlNPTi5zdHJpbmdpZnkoYWxnb3JpdGhtcyl9YCk7XG4gIH1cbiAgcmV0dXJuIChhc3luYyAob2JqLCBhbGdvcml0aG0pID0+IHtcbiAgICBjb25zdCBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gICAgY29uc3QgaGFzaElucHV0ID0gZW5jb2Rlci5lbmNvZGUoaGFzaGFibGUob2JqKSkuYnVmZmVyO1xuICAgIGxldCBkaWdlc3QgPSAnJztcbiAgICB7XG4gICAgICBjb25zdCBub2RlQWxnID0gYWxnb3JpdGhtLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnLScsICcnKTtcbiAgICAgIGRpZ2VzdCA9IHJlcXVpcmUoJ2NyeXB0bycpLmNyZWF0ZUhhc2gobm9kZUFsZykudXBkYXRlKEJ1ZmZlci5mcm9tKGhhc2hJbnB1dCkpLmRpZ2VzdCgnaGV4Jyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcbiAgICB9XG4gICAgLyogZXNsaW50LWVuYWJsZSBuby1sb25lLWJsb2NrcyAqL1xuICAgIHJldHVybiBkaWdlc3Q7XG4gIH0pKG9iaiwgYWxnb3JpdGhtKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRpZ2VzdDtcbiJdfQ==