var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import core from '@actions/core';
import fetch from 'node-fetch';
const slack = (payload, webhook) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield fetch(webhook, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Accept: 'application/json'
        }
    });
    core.debug(`Slack response: ${yield res.text()}`);
});
export { slack };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2xhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL3NsYWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLE9BQU8sSUFBSSxNQUFNLGVBQWUsQ0FBQztBQUNqQyxPQUFPLEtBQUssTUFBTSxZQUFZLENBQUM7QUFHL0IsTUFBTSxLQUFLLEdBQUcsQ0FBTyxPQUFnQixFQUFFLE9BQWUsRUFBRSxFQUFFO0lBQ3hELE1BQU0sR0FBRyxHQUFHLE1BQU0sS0FBSyxDQUFDLE9BQU8sRUFBRTtRQUMvQixNQUFNLEVBQUUsTUFBTTtRQUNkLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztRQUM3QixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsaUNBQWlDO1lBQ2pELE1BQU0sRUFBRSxrQkFBa0I7U0FDM0I7S0FDRixDQUFDLENBQUM7SUFDSCxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDcEQsQ0FBQyxDQUFBLENBQUM7QUFFRixPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY29yZSBmcm9tICdAYWN0aW9ucy9jb3JlJztcbmltcG9ydCBmZXRjaCBmcm9tICdub2RlLWZldGNoJztcbmltcG9ydCB7IFBheWxvYWQgfSBmcm9tICcuLi90eXBlcyc7XG5cbmNvbnN0IHNsYWNrID0gYXN5bmMgKHBheWxvYWQ6IFBheWxvYWQsIHdlYmhvb2s6IHN0cmluZykgPT4ge1xuICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh3ZWJob29rLCB7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgaGVhZGVyczoge1xuICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04JyxcbiAgICAgIEFjY2VwdDogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgfVxuICB9KTtcbiAgY29yZS5kZWJ1ZyhgU2xhY2sgcmVzcG9uc2U6ICR7YXdhaXQgcmVzLnRleHQoKX1gKTtcbn07XG5cbmV4cG9ydCB7IHNsYWNrIH07XG4iXX0=